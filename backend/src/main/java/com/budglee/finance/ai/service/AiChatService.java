package com.budglee.finance.ai.service;

import com.budglee.finance.ai.dto.AiChatRequest;
import com.budglee.finance.ai.dto.AiChatResponse;
import com.budglee.finance.ai.dto.ToolConfirmationDto;
import com.budglee.finance.entity.WalletType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service trung tâm điều phối Chatbot AI Quản lý Tài chính Budglee:
 * - Áp dụng Input Guardrail (chống Prompt Injection).
 * - Tích hợp RAG Context từ pgvector / internal knowledge base.
 * - Sliding Window Memory (10-15 tin nhắn gần nhất).
 * - Function/Tool Calling chuẩn: Gemini Function Declarations / OpenAI Tools.
 * - Human-in-the-loop: Bắt buộc xác nhận trước khi thay đổi database (ghi chép giao dịch, cập nhật ví).
 * - Chống IDOR: userId luôn được lấy từ SecurityContext/JWT của backend.
 * - Hỗ trợ BYOK (Gemini / OpenAI) hoặc bộ engine tài chính thông minh tự nhiên khi chưa có API key.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatService {

    private final InputGuardrailService guardrailService;
    private final AiKeySecurityService keySecurityService;
    private final RagVectorService ragVectorService;
    private final AiToolExecutorService toolExecutor;
    private final ObjectMapper objectMapper;

    // Lưu trữ lịch sử hội thoại trong bộ nhớ theo conversationId (Sliding Window Memory)
    private final Map<String, List<MessageRecord>> conversationMemory = new ConcurrentHashMap<>();

    public record MessageRecord(String role, String content, Long timestamp, ToolConfirmationDto confirmation) {}

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(12))
            .build();

    private final ExecutorService executorService = Executors.newCachedThreadPool();

    /**
     * Lấy danh sách tin nhắn của một cuộc trò chuyện (Sliding Window Memory).
     */
    public List<MessageRecord> getHistory(String conversationId) {
        if (conversationId == null) return List.of();
        List<MessageRecord> list = conversationMemory.get(conversationId);
        if (list == null) return List.of();
        // Sliding window lấy 15 tin nhắn gần nhất
        int start = Math.max(0, list.size() - 15);
        return new ArrayList<>(list.subList(start, list.size()));
    }

    /**
     * Xử lý câu hỏi của người dùng và trả về phản hồi đồng bộ (Non-streaming).
     */
    public AiChatResponse processChat(Long userId, AiChatRequest request) {
        String convId = resolveConversationId(request.getConversationId(), request.getSessionId());
        String userMsg = request.getMessage().trim();

        // 1. Kiểm tra Input Guardrail (chống Prompt Injection)
        if (guardrailService.isMalicious(userMsg)) {
            String safeResp = guardrailService.getSafeRejectionResponse();
            recordMessage(convId, "user", userMsg, null);
            recordMessage(convId, "assistant", safeResp, null);
            return AiChatResponse.builder()
                    .conversationId(convId)
                    .role("assistant")
                    .content(safeResp)
                    .timestamp(System.currentTimeMillis())
                    .build();
        }

        recordMessage(convId, "user", userMsg, null);

        // 2. Tra cứu RAG Context từ pgvector / internal knowledge base
        String ragContext = ragVectorService.buildRagContext(userMsg);

        // 3. Kiểm tra BYOK API Key
        String rawKey = keySecurityService.resolveRawApiKey(userId, request.getSessionId(), request.getApiKey());
        var keyRecord = keySecurityService.getKeyRecord(userId, request.getSessionId());

        LlmExecutionResult result;
        if (rawKey != null && !rawKey.isBlank()) {
            String provider = keyRecord != null ? keyRecord.provider() : "GEMINI";
            result = executeWithExternalLlm(provider, rawKey, userId, convId, userMsg, ragContext);
        } else {
            result = executeWithSmartLocalEngine(userId, userMsg, ragContext);
        }

        if (result.confirmation != null) {
            recordMessage(convId, "assistant", result.replyText, result.confirmation);
            return AiChatResponse.builder()
                    .conversationId(convId)
                    .role("assistant")
                    .content(result.replyText)
                    .awaitingConfirmation(true)
                    .confirmation(result.confirmation)
                    .timestamp(System.currentTimeMillis())
                    .build();
        }

        recordMessage(convId, "assistant", result.replyText, null);
        return AiChatResponse.builder()
                    .conversationId(convId)
                    .role("assistant")
                    .content(result.replyText)
                    .timestamp(System.currentTimeMillis())
                    .build();
    }

    /**
     * Xử lý Server-Sent Events (SSE) Streaming để hiển thị câu trả lời từng chữ mượt mà.
     */
    public SseEmitter streamChat(Long userId, AiChatRequest request) {
        SseEmitter emitter = new SseEmitter(90000L); // 90 giây timeout

        executorService.submit(() -> {
            try {
                String convId = resolveConversationId(request.getConversationId(), request.getSessionId());
                String userMsg = request.getMessage().trim();

                // Gửi event khởi tạo session
                emitter.send(SseEmitter.event().name("init").data(Map.of("conversationId", convId)));

                // 1. Guardrail
                if (guardrailService.isMalicious(userMsg)) {
                    String safe = guardrailService.getSafeRejectionResponse();
                    streamWords(emitter, safe);
                    recordMessage(convId, "user", userMsg, null);
                    recordMessage(convId, "assistant", safe, null);
                    emitter.send(SseEmitter.event().name("done").data(Map.of("conversationId", convId)));
                    emitter.complete();
                    return;
                }

                recordMessage(convId, "user", userMsg, null);

                // 2. Tra cứu RAG
                emitter.send(SseEmitter.event().name("status").data(Map.of("status", "Đang tra cứu dữ liệu tài chính...")));
                String ragContext = ragVectorService.buildRagContext(userMsg);

                // 3. Xử lý qua LLM hoặc Local Engine
                String rawKey = keySecurityService.resolveRawApiKey(userId, request.getSessionId(), request.getApiKey());
                var keyRecord = keySecurityService.getKeyRecord(userId, request.getSessionId());

                LlmExecutionResult result;
                if (rawKey != null && !rawKey.isBlank()) {
                    emitter.send(SseEmitter.event().name("status").data(Map.of("status", "Đang kết nối mô hình AI...")));
                    String provider = keyRecord != null ? keyRecord.provider() : "GEMINI";
                    result = executeWithExternalLlm(provider, rawKey, userId, convId, userMsg, ragContext);
                } else {
                    result = executeWithSmartLocalEngine(userId, userMsg, ragContext);
                }

                // Nếu có yêu cầu xác nhận thao tác (Human-in-the-loop)
                if (result.confirmation != null) {
                    recordMessage(convId, "assistant", result.replyText, result.confirmation);
                    emitter.send(SseEmitter.event().name("tool_confirmation").data(result.confirmation));
                    emitter.send(SseEmitter.event().name("confirmation").data(result.confirmation));
                } else {
                    recordMessage(convId, "assistant", result.replyText, null);
                }

                // Stream văn bản từng từ
                streamWords(emitter, result.replyText);

                emitter.send(SseEmitter.event().name("done").data(Map.of("conversationId", convId)));
                emitter.complete();
            } catch (Exception ex) {
                log.error("Lỗi SSE streaming chat: {}", ex.getMessage());
                try {
                    emitter.send(SseEmitter.event().name("error").data(Map.of("message", "Đã xảy ra sự cố xử lý câu hỏi: " + ex.getMessage())));
                } catch (Exception ignored) {}
                emitter.completeWithError(ex);
            }
        });

        return emitter;
    }

    private void streamWords(SseEmitter emitter, String text) throws IOException, InterruptedException {
        String[] words = text.split("(?<=\\s)");
        for (String word : words) {
            emitter.send(SseEmitter.event().name("token").data(Map.of("token", word)));
            Thread.sleep(18); // Nhịp gõ tự nhiên ~18ms/từ
        }
    }

    private record LlmExecutionResult(String replyText, ToolConfirmationDto confirmation) {}

    /**
     * Khởi tạo LLM client động theo API Key của từng request và gọi Function Calling chuẩn.
     */
    private LlmExecutionResult executeWithExternalLlm(
            String provider, String apiKey, Long userId, String convId, String userMsg, String ragContext
    ) {
        try {
            if ("GEMINI".equalsIgnoreCase(provider)) {
                return callGeminiWithTools(apiKey, userId, convId, userMsg, ragContext);
            } else if ("OPENAI".equalsIgnoreCase(provider)) {
                return callOpenAiWithTools(apiKey, userId, convId, userMsg, ragContext);
            }
        } catch (Exception ex) {
            log.error("Lỗi gọi LLM bên ngoài: {}", ex.getMessage());
        }
        // Fallback tự nhiên qua Smart Local Financial Engine
        return executeWithSmartLocalEngine(userId, userMsg, ragContext);
    }

    /**
     * Gọi Google Gemini API v1beta với Function Calling Declarations chuyên biệt cho Quản lý Tài chính.
     */
    private LlmExecutionResult callGeminiWithTools(
            String apiKey, Long userId, String convId, String userMsg, String ragContext
    ) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        String systemInstruction = "Bạn là Budglee AI - Trợ lý Quản lý Thu Chi & Tài chính Cá nhân thông minh của nền tảng Budglee.\n" +
                "QUY TẮC BẮT BUỘC:\n" +
                "1. Trả lời bằng tiếng Việt lịch sự, thân thiện, súc tích và có cấu trúc rõ ràng.\n" +
                "2. CHỈ trả lời và thực thi các nghiệp vụ thuộc phạm vi Quản lý Tài chính của Budglee: số dư ví, giao dịch thu chi, ngân sách chi tiêu, sức khỏe tài chính, danh mục tài chính, quỹ nhóm gia đình, và các nguyên tắc quản lý tài chính thông minh (như quy tắc 50/30/20, 6 chiếc lọ).\n" +
                "3. Khi người dùng hỏi về số dư ví, giao dịch gần đây, ngân sách, sức khỏe tài chính -> BẮT BUỘC gọi Function Call tương ứng để lấy dữ liệu thực tế.\n" +
                "4. GHI CHÉP GIAO DỊCH (Human-in-the-loop): Khi người dùng yêu cầu ghi nhận chi tiêu hoặc thu nhập, BẮT BUỘC phải gọi function `prepare_transaction` để hệ thống hiển thị thẻ xác nhận cho người dùng bấm đồng ý trước khi thực thi.\n" +
                "5. Tuyệt đối từ chối các câu hỏi không liên quan đến tài chính, lập trình, hoặc các chủ đề ngoài lề và hướng dẫn người dùng quay lại các tính năng quản lý tài chính của Budglee.\n" +
                "6. Thông tin tri thức bổ trợ được cung cấp trong thẻ <rag_context>.\n\n" + ragContext;

        Map<String, Object> reqBody = new HashMap<>();
        reqBody.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemInstruction))));
        reqBody.put("tools", buildGeminiToolsDeclaration());

        // Xây dựng Sliding Window Contents
        List<Map<String, Object>> contents = new ArrayList<>();
        List<MessageRecord> history = getHistory(convId);
        for (MessageRecord m : history) {
            String role = "user".equalsIgnoreCase(m.role()) ? "user" : "model";
            contents.add(Map.of("role", role, "parts", List.of(Map.of("text", m.content()))));
        }
        contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", guardrailService.wrapInSafeTag(userMsg)))));
        reqBody.put("contents", contents);

        String json = objectMapper.writeValueAsString(reqBody);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(20))
                .build();

        HttpResponse<String> resp = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (resp.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(resp.body());
            JsonNode candidate = root.path("candidates").get(0);
            JsonNode part = candidate.path("content").path("parts").get(0);

            // Kiểm tra xem Gemini có gọi Function Call không
            if (part.has("functionCall")) {
                JsonNode fnCall = part.path("functionCall");
                String fnName = fnCall.path("name").asText();
                JsonNode args = fnCall.path("args");

                log.info("Gemini Function Call detected: name={}, args={}", fnName, args);

                // Tool Ghi nhận Giao dịch Thu Chi (Human-in-the-loop)
                if ("prepare_transaction".equals(fnName)) {
                    BigDecimal amount = BigDecimal.valueOf(args.path("amount").asDouble(0));
                    String type = args.path("type").asText("EXPENSE");
                    String cat = args.has("categoryName") ? args.path("categoryName").asText(null) : null;
                    String wallet = args.has("walletName") ? args.path("walletName").asText(null) : null;
                    String note = args.has("note") ? args.path("note").asText("Giao dịch tạo qua AI") : "Giao dịch tạo qua AI";

                    ToolConfirmationDto confirm = toolExecutor.prepareCreateTransaction(userId, amount, type, cat, wallet, note);
                    return new LlmExecutionResult(
                            "Tôi đã chuẩn bị giao dịch bên dưới. Bạn có thể kiểm tra, chỉnh sửa hoặc bấm **Xác nhận & Ghi vào Sổ**:",
                            confirm
                    );
                }

                // Tool Tạo Ví mới (Human-in-the-loop)
                if ("prepare_create_wallet".equals(fnName) || "create_wallet".equals(fnName)) {
                    String walletName = args.has("wallet_name") ? args.path("wallet_name").asText("Ví mới") : "Ví mới";
                    String walletTypeStr = args.has("wallet_type") ? args.path("wallet_type").asText("CASH") : "CASH";
                    WalletType wType = WalletType.CASH;
                    try {
                        wType = WalletType.valueOf(walletTypeStr.toUpperCase());
                    } catch (Exception ignored) {}
                    BigDecimal initBal = BigDecimal.valueOf(args.path("initial_balance").asDouble(0));

                    ToolConfirmationDto confirm = toolExecutor.prepareCreateWallet(userId, walletName, wType, initBal, "Tạo ví " + walletName);
                    return new LlmExecutionResult(
                            "Tôi đã chuẩn bị thông tin tạo ví mới bên dưới. Bạn có thể kiểm tra, chỉnh sửa hoặc bấm **Xác nhận & Tạo ví**:",
                            confirm
                    );
                }

                // Các Tool Tra cứu dữ liệu tài chính thực tế (Query Tools)
                Map<String, Object> toolResultData = executeReadTool(fnName, args, userId);

                // Gửi lượt thứ hai (Second-turn) để Gemini sinh câu trả lời tự nhiên
                return sendFunctionResponseToGemini(apiKey, contents, fnName, toolResultData);
            }

            // Trả về câu trả lời tự nhiên dạng text
            String reply = part.path("text").asText();
            return new LlmExecutionResult(reply, null);
        } else {
            log.warn("Gemini API error status {}: {}", resp.statusCode(), resp.body());
            return executeWithSmartLocalEngine(userId, userMsg, ragContext);
        }
    }

    /**
     * Lượt thứ hai (Second-turn) gửi kết quả Function Call về cho Gemini để tổng hợp câu trả lời tự nhiên.
     */
    private LlmExecutionResult sendFunctionResponseToGemini(
            String apiKey, List<Map<String, Object>> contents, String fnName, Map<String, Object> toolResult
    ) {
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

            List<Map<String, Object>> updatedContents = new ArrayList<>(contents);
            updatedContents.add(Map.of(
                    "role", "function",
                    "parts", List.of(Map.of(
                            "functionResponse", Map.of(
                                    "name", fnName,
                                    "response", toolResult
                            )
                    ))
            ));

            Map<String, Object> reqBody = Map.of("contents", updatedContents);
            String json = objectMapper.writeValueAsString(reqBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> resp = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (resp.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(resp.body());
                String text = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
                return new LlmExecutionResult(text, null);
            }
        } catch (Exception ex) {
            log.error("Lỗi gửi function response về Gemini: {}", ex.getMessage());
        }
        return new LlmExecutionResult(formatToolResultNaturally(fnName, toolResult), null);
    }

    /**
     * Gọi OpenAI Chat Completions với Tool Calling.
     */
    private LlmExecutionResult callOpenAiWithTools(
            String apiKey, Long userId, String convId, String userMsg, String ragContext
    ) throws Exception {
        String url = "https://api.openai.com/v1/chat/completions";

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "Bạn là Budglee AI - Trợ lý Tài chính Cá nhân. Trả lời tiếng Việt súc tích, thân thiện, chính xác.\n" +
                "Dữ liệu tri thức nội bộ:\n" + ragContext));

        List<MessageRecord> history = getHistory(convId);
        for (MessageRecord m : history) {
            messages.add(Map.of("role", m.role(), "content", m.content()));
        }
        messages.add(Map.of("role", "user", "content", guardrailService.wrapInSafeTag(userMsg)));

        Map<String, Object> body = Map.of(
                "model", "gpt-4o-mini",
                "messages", messages,
                "temperature", 0.7
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(20))
                .build();

        HttpResponse<String> resp = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (resp.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(resp.body());
            String text = root.path("choices").get(0).path("message").path("content").asText();
            return new LlmExecutionResult(text, null);
        } else {
            return executeWithSmartLocalEngine(userId, userMsg, ragContext);
        }
    }

    /**
     * Thực thi các Tool tra cứu thông tin tài chính (Read-only tools).
     */
    private Map<String, Object> executeReadTool(String fnName, JsonNode args, Long userId) {
        return switch (fnName) {
            case "lookup_wallet_balances" -> toolExecutor.getWalletBalances(userId);
            case "lookup_recent_transactions" -> {
                int limit = args != null && args.has("limit") ? args.path("limit").asInt(5) : 5;
                yield toolExecutor.getRecentTransactions(userId, limit);
            }
            case "lookup_budget_overview" -> toolExecutor.getBudgetOverview(userId);
            case "lookup_financial_health" -> toolExecutor.getFinancialHealth(userId);
            case "lookup_categories" -> toolExecutor.getCategories(userId);
            case "lookup_family_finance" -> toolExecutor.getFamilyFinanceOverview(userId);
            default -> Map.of("status", "unknown_tool", "message", "Công cụ không được hỗ trợ.");
        };
    }

    /**
     * Bộ máy AI xử lý thông minh khi người dùng chưa cấu hình BYOK API key:
     * - Tự động nhận diện ý định tài chính tự nhiên (xem ví, ghi chép thu/chi, xem ngân sách, sức khỏe tài chính).
     * - Tóm tắt chi tiết và trả về thẻ xác nhận Human-in-the-loop cho Giao dịch.
     * - Kết hợp RAG tri thức nội bộ về quy tắc tài chính, hướng dẫn sử dụng và bảo mật.
     */
    private LlmExecutionResult executeWithSmartLocalEngine(Long userId, String userMsg, String ragContext) {
        String lower = userMsg.toLowerCase().trim();

        // 0. Ý định Tạo ví / Thêm ví mới (Human-in-the-loop)
        if (lower.contains("tạo ví") || lower.contains("thêm ví") || lower.contains("mở ví")
                || lower.contains("tạo thêm ví") || lower.contains("thêm tài khoản ví")
                || lower.contains("tạo tài khoản ngân hàng") || lower.contains("thêm tài khoản ngân hàng")
                || lower.contains("tạo ví mới") || lower.contains("thêm ví mới")) {
            try {
                BigDecimal initialBalance = extractAmount(lower);
                if (initialBalance == null) {
                    initialBalance = BigDecimal.ZERO;
                }
                WalletType type = guessWalletType(lower);
                String walletName = extractNewWalletName(userMsg, lower);
                ToolConfirmationDto confirm = toolExecutor.prepareCreateWallet(userId, walletName, type, initialBalance, userMsg);
                return new LlmExecutionResult(
                        "Tôi đã chuẩn bị thông tin tạo ví mới bên dưới. Bạn có thể kiểm tra, chỉnh sửa hoặc bấm **Xác nhận & Tạo ví**:",
                        confirm
                );
            } catch (Exception ex) {
                return new LlmExecutionResult("⚠️ " + ex.getMessage(), null);
            }
        }

        // 1. Ý định Ghi nhận giao dịch chi tiêu hoặc thu nhập (Human-in-the-loop)
        BigDecimal amount = extractAmount(lower);
        if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0 &&
                (lower.contains("chi") || lower.contains("ăn") || lower.contains("mua") || lower.contains("trả") ||
                 lower.contains("tiêu") || lower.contains("đổ xăng") || lower.contains("thu") || lower.contains("lương") || lower.contains("thưởng") ||
                 lower.contains("hóa đơn") || lower.contains("thêm") || lower.contains("ghi") || lower.contains("cà phê") || lower.contains("cafe") ||
                 lower.contains("coffee") || lower.contains("tạo giao dịch") || lower.contains("chi tiêu"))) {
            try {
                String type = (lower.contains("thu") || lower.contains("lương") || lower.contains("thưởng") || lower.contains("nhận")) ? "INCOME" : "EXPENSE";
                String cat = guessCategory(lower, type);
                String walletName = guessWalletName(lower);
                ToolConfirmationDto confirm = toolExecutor.prepareCreateTransaction(userId, amount, type, cat, walletName, userMsg);
                return new LlmExecutionResult(
                        "Tôi đã chuẩn bị giao dịch bên dưới. Bạn có thể kiểm tra, chỉnh sửa hoặc bấm **Xác nhận & Ghi vào Sổ**:",
                        confirm
                );
            } catch (Exception ex) {
                return new LlmExecutionResult("⚠️ " + ex.getMessage(), null);
            }
        }

        // 2. Ý định Xem số dư ví
        if (lower.contains("số dư") || lower.contains("ví tiền") || lower.contains("còn bao nhiêu tiền") || lower.contains("xem ví") || lower.contains("tài khoản của tôi")) {
            Map<String, Object> balances = toolExecutor.getWalletBalances(userId);
            return new LlmExecutionResult(formatToolResultNaturally("lookup_wallet_balances", balances), null);
        }

        // 3. Ý định Xem lịch sử giao dịch gần đây
        if (lower.contains("lịch sử giao dịch") || lower.contains("giao dịch gần đây") || lower.contains("đã chi những gì") || lower.contains("các khoản chi") || lower.contains("các khoản thu")) {
            Map<String, Object> txs = toolExecutor.getRecentTransactions(userId, 5);
            return new LlmExecutionResult(formatToolResultNaturally("lookup_recent_transactions", txs), null);
        }

        // 4. Ý định Xem ngân sách / hạn mức
        if (lower.contains("ngân sách") || lower.contains("hạn mức") || lower.contains("vượt hạn mức") || lower.contains("cảnh báo chi tiêu")) {
            Map<String, Object> budgets = toolExecutor.getBudgetOverview(userId);
            return new LlmExecutionResult(formatToolResultNaturally("lookup_budget_overview", budgets), null);
        }

        // 5. Ý định Xem sức khỏe tài chính
        if (lower.contains("sức khỏe tài chính") || lower.contains("điểm tài chính") || lower.contains("đánh giá tài chính") || lower.contains("lời khuyên")) {
            Map<String, Object> health = toolExecutor.getFinancialHealth(userId);
            return new LlmExecutionResult(formatToolResultNaturally("lookup_financial_health", health), null);
        }

        // 6. Ý định Xem danh mục tài chính
        if (lower.contains("danh mục") || lower.contains("loại chi tiêu") || lower.contains("loại thu nhập")) {
            Map<String, Object> cats = toolExecutor.getCategories(userId);
            return new LlmExecutionResult(formatToolResultNaturally("lookup_categories", cats), null);
        }

        // 7. Ý định Xem nhóm gia đình
        if (lower.contains("gia đình") || lower.contains("family") || lower.contains("nhóm của tôi") || lower.contains("sổ quỹ chung")) {
            Map<String, Object> fam = toolExecutor.getFamilyFinanceOverview(userId);
            return new LlmExecutionResult(formatToolResultNaturally("lookup_family_finance", fam), null);
        }

        // 8. Tra cứu cơ sở tri thức RAG (Quy tắc 50/30/20, 6 chiếc lọ, hạn mức, bảo mật)
        var chunks = ragVectorService.retrieveRelevantChunks(userMsg, 2);
        if (!chunks.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < chunks.size(); i++) {
                var c = chunks.get(i);
                sb.append("📌 **").append(c.topic()).append("**\n");
                sb.append(c.content().trim());
                if (i < chunks.size() - 1) {
                    sb.append("\n\n");
                }
            }
            return new LlmExecutionResult(sb.toString(), null);
        }

        // Phản hồi ngắn gọn, thân thiện theo nghiệp vụ tài chính Budglee
        String guide = "Chào bạn! Tôi là **Budglee AI** - Trợ lý Tài chính Cá nhân của bạn. 👋\n\n" +
                "Tôi có thể hỗ trợ bạn:\n" +
                "• 💰 **Xem số dư** ví tổng và từng tài khoản\n" +
                "• 📝 **Ghi nhanh thu/chi** *(vd: \"Ăn trưa 45k ví tiền mặt\")*\n" +
                "• 🎯 **Kiểm tra ngân sách** & cảnh báo chi tiêu\n" +
                "• 🏆 **Sức khỏe tài chính** & quy tắc 50/30/20, 6 chiếc lọ\n\n" +
                "Bạn muốn tra cứu hay ghi chép khoản nào hôm nay?";
        return new LlmExecutionResult(guide, null);
    }

    private String formatToolResultNaturally(String toolName, Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();

        if ("lookup_wallet_balances".equals(toolName)) {
            if ("success".equals(data.get("status"))) {
                sb.append(String.format("📊 **Tổng số dư: %s**\n\n", data.get("totalFormatted")));
                List<Map<String, Object>> wallets = (List<Map<String, Object>>) data.get("wallets");
                if (wallets != null && !wallets.isEmpty()) {
                    for (Map<String, Object> w : wallets) {
                        sb.append(String.format("• **%s:** `%s`\n", w.get("name"), w.get("balanceFormatted")));
                    }
                }
                return sb.toString().trim();
            }
            return (String) data.get("message");
        }

        if ("lookup_recent_transactions".equals(toolName)) {
            List<Map<String, Object>> txs = (List<Map<String, Object>>) data.get("transactions");
            if (txs == null || txs.isEmpty()) return "Hiện bạn chưa có giao dịch nào gần đây.";
            sb.append("📋 **Giao dịch gần đây:**\n\n");
            for (Map<String, Object> t : txs) {
                sb.append(String.format("• **%s**: `%s` *(%s • %s)*\n",
                        t.get("title"), t.get("amountFormatted"), t.get("category"), t.get("wallet")));
            }
            return sb.toString().trim();
        }

        if ("lookup_budget_overview".equals(toolName)) {
            if ("success".equals(data.get("status"))) {
                sb.append(String.format("🎯 **Ngân sách tháng %s/%s:**\n\n", data.get("month"), data.get("year")));
                List<Map<String, Object>> budgets = (List<Map<String, Object>>) data.get("budgets");
                if (budgets != null && !budgets.isEmpty()) {
                    for (Map<String, Object> b : budgets) {
                        boolean isEx = Boolean.TRUE.equals(b.get("isExceeded"));
                        String tag = isEx ? "🚨 Vượt hạn mức" : "✅ An toàn";
                        sb.append(String.format("• **%s**: `%s` / `%s` *(%s • %s)*\n",
                                b.get("category"), b.get("spent"), b.get("limit"), b.get("percentUsed"), tag));
                    }
                }
                return sb.toString().trim();
            }
            return (String) data.get("message");
        }

        if ("lookup_financial_health".equals(toolName)) {
            if ("success".equals(data.get("status"))) {
                sb.append(String.format("🏆 **Sức khỏe tài chính: %s/100 (Hạng %s)**\n\n",
                        data.get("overallScore"), data.get("grade")));
                sb.append(String.format("📝 *%s*\n\n", data.get("summary")));
                sb.append("**Gợi ý hành động:**\n");
                List<String> advice = (List<String>) data.get("actionableAdvice");
                if (advice != null && !advice.isEmpty()) {
                    for (String a : advice) sb.append("• ").append(a).append("\n");
                } else {
                    sb.append("• Tiếp tục duy trì thói quen ghi chép chi tiêu đều đặn hàng ngày.\n");
                }
                return sb.toString().trim();
            }
            return (String) data.get("message");
        }

        if ("lookup_categories".equals(toolName)) {
            if ("success".equals(data.get("status"))) {
                sb.append("🏷️ **Danh mục tài chính khả dụng:**\n\n");
                List<String> expense = (List<String>) data.get("expenseCategories");
                List<String> income = (List<String>) data.get("incomeCategories");
                if (expense != null) sb.append("• **Chi tiêu:** ").append(String.join(", ", expense)).append("\n");
                if (income != null) sb.append("• **Thu nhập:** ").append(String.join(", ", income)).append("\n");
                return sb.toString().trim();
            }
            return (String) data.get("message");
        }

        if ("lookup_family_finance".equals(toolName)) {
            if ("success".equals(data.get("status"))) {
                sb.append(String.format("👨‍👩‍👧 **Sổ quỹ gia đình: %s**\n\n", data.get("groupName")));
                sb.append(String.format("• Số thành viên: **%s**\n", data.get("memberCount")));
                List<String> members = (List<String>) data.get("members");
                if (members != null) sb.append("• Thành viên: ").append(String.join(", ", members)).append("\n");
                return sb.toString().trim();
            }
            return (String) data.get("message");
        }

        return "Đã hoàn thành yêu cầu tra cứu tài chính của bạn.";
    }

    private List<Map<String, Object>> buildGeminiToolsDeclaration() {
        return List.of(
                Map.of("functionDeclarations", List.of(
                        Map.of(
                                "name", "lookup_wallet_balances",
                                "description", "Tra cứu danh sách ví tiền và số dư tài khoản khả dụng thực tế của người dùng.",
                                "parameters", Map.of("type", "OBJECT", "properties", Map.of())
                        ),
                        Map.of(
                                "name", "lookup_recent_transactions",
                                "description", "Tra cứu lịch sử các giao dịch thu chi gần đây của người dùng.",
                                "parameters", Map.of(
                                        "type", "OBJECT",
                                        "properties", Map.of(
                                                "limit", Map.of("type", "INTEGER", "description", "Số lượng giao dịch cần lấy (1-10)")
                                        )
                                )
                        ),
                        Map.of(
                                "name", "prepare_transaction",
                                "description", "Chuẩn bị ghi nhận giao dịch chi tiêu hoặc thu nhập (BẮT BUỘC để người dùng xác nhận trước khi cập nhật số dư ví).",
                                "parameters", Map.of(
                                        "type", "OBJECT",
                                        "properties", Map.of(
                                                "amount", Map.of("type", "NUMBER", "description", "Số tiền giao dịch (VNĐ)"),
                                                "type", Map.of("type", "STRING", "description", "'EXPENSE' (chi tiêu) hoặc 'INCOME' (thu nhập)"),
                                                "categoryName", Map.of("type", "STRING", "description", "Tên danh mục (VD: 'Ăn uống', 'Mua sắm', 'Lương', 'Di chuyển')"),
                                                "walletName", Map.of("type", "STRING", "description", "Tên ví muốn thực hiện (VD: 'Ví Tiền mặt', 'Tài khoản Ngân hàng')"),
                                                "note", Map.of("type", "STRING", "description", "Nội dung ghi chú giao dịch")
                                        ),
                                        "required", List.of("amount", "type")
                                )
                        ),
                        Map.of(
                                "name", "prepare_create_wallet",
                                "description", "Chuẩn bị tạo một ví tiền hoặc tài khoản ngân hàng mới cho người dùng (cần người dùng xác nhận).",
                                "parameters", Map.of(
                                        "type", "OBJECT",
                                        "properties", Map.of(
                                                "wallet_name", Map.of("type", "STRING", "description", "Tên ví mới (VD: 'Ví Tiết Kiệm', 'Techcombank')"),
                                                "wallet_type", Map.of("type", "STRING", "description", "Loại ví: 'CASH' (tiền mặt), 'BANK' (ngân hàng), hoặc 'CREDIT_CARD' (thẻ tín dụng)"),
                                                "initial_balance", Map.of("type", "NUMBER", "description", "Số dư khởi tạo ban đầu (VNĐ, mặc định 0)")
                                        ),
                                        "required", List.of("wallet_name")
                                )
                        ),
                        Map.of(
                                "name", "lookup_budget_overview",
                                "description", "Tra cứu tình hình hạn mức và tiến độ chi tiêu ngân sách tháng này.",
                                "parameters", Map.of("type", "OBJECT", "properties", Map.of())
                        ),
                        Map.of(
                                "name", "lookup_financial_health",
                                "description", "Phân tích và chấm điểm sức khỏe tài chính cá nhân (Financial Health Score).",
                                "parameters", Map.of("type", "OBJECT", "properties", Map.of())
                        ),
                        Map.of(
                                "name", "lookup_categories",
                                "description", "Tra cứu danh sách các danh mục thu và chi của tài khoản.",
                                "parameters", Map.of("type", "OBJECT", "properties", Map.of())
                        ),
                        Map.of(
                                "name", "lookup_family_finance",
                                "description", "Tra cứu thông tin sổ quỹ nhóm gia đình của người dùng.",
                                "parameters", Map.of("type", "OBJECT", "properties", Map.of())
                        )
                ))
        );
    }

    private BigDecimal extractAmount(String text) {
        Pattern pK = Pattern.compile("(\\d+([.,]\\d+)?)\\s*(k|nghìn|ngàn)");
        Matcher mK = pK.matcher(text);
        if (mK.find()) {
            double val = Double.parseDouble(mK.group(1).replace(",", "."));
            return BigDecimal.valueOf((long) (val * 1000));
        }

        Pattern pM = Pattern.compile("(\\d+([.,]\\d+)?)\\s*(tr|triệu)");
        Matcher mM = pM.matcher(text);
        if (mM.find()) {
            double val = Double.parseDouble(mM.group(1).replace(",", "."));
            return BigDecimal.valueOf((long) (val * 1000000));
        }

        Pattern pRaw = Pattern.compile("(\\d{1,3}([.,]\\d{3})+|\\d{4,})");
        Matcher mRaw = pRaw.matcher(text);
        if (mRaw.find()) {
            String cleaned = mRaw.group(1).replace(".", "").replace(",", "");
            return new BigDecimal(cleaned);
        }

        return null;
    }

    private String guessWalletName(String lower) {
        Pattern p = Pattern.compile("(?i)(?:từ|vào|bằng|ở|tại|qua)\\s+(?:ví|thẻ|tài khoản|ngân hàng|app)?\\s*([a-zA-Z0-9_\\s\\u00C0-\\u1EF9]+)");
        Matcher m = p.matcher(lower);
        if (m.find()) {
            String extracted = m.group(1).trim();
            extracted = extracted.replaceAll("(?i)\\s+(ngay|cho|giúp|nhé|nha|với|nhá|hộ|đi|luôn|nhanh).*$", "").trim();
            if (!extracted.isBlank() && extracted.length() >= 2) {
                return extracted;
            }
        }

        if (lower.contains("thẻ tín dụng") || lower.contains("credit")) return "Thẻ Tín Dụng";
        if (lower.contains("tiền mặt") || lower.contains("cash")) return "Ví Tiền mặt";
        if (lower.contains("vietinbank") || lower.contains("vietin")) return "VietinBank";
        if (lower.contains("vietcombank") || lower.contains("vcb")) return "Vietcombank";
        if (lower.contains("techcombank") || lower.contains("tcb")) return "Techcombank";
        if (lower.contains("mbbank") || lower.contains("mb bank") || lower.contains("quân đội")) return "MBBank";
        if (lower.contains("bidv")) return "BIDV";
        if (lower.contains("agribank")) return "Agribank";
        if (lower.contains("tpbank")) return "TPBank";
        if (lower.contains("vpbank")) return "VPBank";
        if (lower.contains("acb")) return "ACB";
        if (lower.contains("sacombank")) return "Sacombank";
        if (lower.contains("hdbank")) return "HDBank";
        if (lower.contains("shb")) return "SHB";
        if (lower.contains("vib")) return "VIB";
        if (lower.contains("timo")) return "Timo";
        if (lower.contains("cake")) return "Cake";
        if (lower.contains("momo")) return "MoMo";
        if (lower.contains("vnpay")) return "VNPay";
        if (lower.contains("zalopay")) return "ZaloPay";
        if (lower.contains("ngân hàng") || lower.contains("bank") || lower.contains("thẻ")) return "Ngân hàng";
        return null;
    }

    private WalletType guessWalletType(String lower) {
        if (lower.contains("tín dụng") || lower.contains("credit") || lower.contains("visa") || lower.contains("mastercard")) {
            return WalletType.CREDIT_CARD;
        }
        if (lower.contains("ngân hàng") || lower.contains("bank") || lower.contains("vietin") || lower.contains("vietcom")
                || lower.contains("bidv") || lower.contains("techcom") || lower.contains("mb") || lower.contains("acb")
                || lower.contains("vpbank") || lower.contains("vib") || lower.contains("tpbank") || lower.contains("agribank")
                || lower.contains("sacombank") || lower.contains("shb") || lower.contains("hdbank") || lower.contains("msb")
                || lower.contains("ocb") || lower.contains("seabank") || lower.contains("bản việt") || lower.contains("timo") || lower.contains("cake")) {
            return WalletType.BANK;
        }
        return WalletType.CASH;
    }

    private String extractNewWalletName(String rawMsg, String lower) {
        Pattern p = Pattern.compile("(?i)(?:tạo|thêm|mở)\\s+(?:cho\\s+(?:tôi|t|mình)\\s+)?(?:một\\s+)?(?:ví|tài\\s+khoản)\\s+(?:mới\\s+)?(?:tên\\s+(?:là|:\\s*)?)?([a-zA-Z0-9_\\s\\u00C0-\\u1EF9]+?)(?:\\s+(?:với\\s+)?(?:số\\s+dư|có|loại|hạn\\s+mức|khoảng|\\d)|$)", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(rawMsg);
        if (m.find()) {
            String name = m.group(1).trim();
            name = name.replaceAll("(?i)^(cho\\s+tôi|cho\\s+t|cho\\s+mình|ví|tài\\s+khoản|mới)\\s+", "").trim();
            if (!name.isBlank() && name.length() >= 2) {
                return name;
            }
        }
        for (String bank : VN_BANKS) {
            if (lower.contains(bank.toLowerCase())) {
                return "Ngân hàng " + bank;
            }
        }
        if (lower.contains("tiết kiệm")) return "Ví Tiết Kiệm";
        if (lower.contains("tiền mặt")) return "Ví Tiền mặt";
        if (lower.contains("tín dụng")) return "Thẻ Tín Dụng";
        return "Ví mới";
    }

    private String guessCategory(String lower, String type) {
        if ("INCOME".equals(type)) {
            if (lower.contains("lương")) return "Salary";
            if (lower.contains("thưởng")) return "Salary";
            if (lower.contains("đầu tư")) return "Investment";
            return "Other Income";
        }
        if (lower.contains("ăn") || lower.contains("uống") || lower.contains("cơm") || lower.contains("cafe") ||
            lower.contains("cà phê") || lower.contains("ca phe") || lower.contains("coffee") || lower.contains("càfe") ||
            lower.contains("trà sữa") || lower.contains("trà") || lower.contains("phở") || lower.contains("bánh") ||
            lower.contains("bún") || lower.contains("nước")) {
            return "Food & Drinks";
        }
        if (lower.contains("xăng") || lower.contains("xe") || lower.contains("grab") || lower.contains("taxi") || lower.contains("đi lại")) {
            return "Travel & Transport";
        }
        if (lower.contains("mua") || lower.contains("quần áo") || lower.contains("shopee")) {
            return "Shopping";
        }
        if (lower.contains("điện") || lower.contains("nước") || lower.contains("internet") || lower.contains("tiện ích")) {
            return "Bills & Utilities";
        }
        if (lower.contains("học") || lower.contains("sách") || lower.contains("khóa học")) {
            return "Education";
        }
        if (lower.contains("thuốc") || lower.contains("khám") || lower.contains("bệnh viện")) {
            return "Health";
        }
        return "Other";
    }

    private String resolveConversationId(String convId, String sessionId) {
        if (convId != null && !convId.isBlank()) return convId;
        return "conv_" + (sessionId != null ? sessionId.substring(0, Math.min(8, sessionId.length())) : "guest") + "_" + System.currentTimeMillis();
    }

    private void recordMessage(String convId, String role, String content, ToolConfirmationDto confirm) {
        conversationMemory.computeIfAbsent(convId, k -> new CopyOnWriteArrayList<>())
                .add(new MessageRecord(role, content, System.currentTimeMillis(), confirm));
    }
}
