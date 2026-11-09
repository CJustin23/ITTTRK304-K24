package com.budglee.finance;

import com.budglee.finance.controller.ApiExceptionHandler;
import com.budglee.finance.entity.Wallet;
import com.budglee.finance.repository.WalletRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * DUAN-50 — số dư ví trước đây chỉ là "đọc rồi ghi", nên hai giao dịch chạy song song trên cùng
 * một ví cho ra một kết quả mà không dòng nào trong lịch sử giải thích được (lost update).
 * V12 thêm cột version và Wallet đánh dấu nó bằng @Version: lần ghi đến sau phải thất bại công khai.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WalletOptimisticLockTest {

    private static final String PASSWORD = "MatKhau123";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private ApiExceptionHandler apiExceptionHandler;

    private JsonNode json(MvcResult result) throws Exception {
        return om.readTree(new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8));
    }

    private String token;

    private String loginNewUser() throws Exception {
        String email = "lock." + UUID.randomUUID() + "@budglee.dev";
        Map<String, Object> body = new HashMap<>();
        body.put("fullName", "Người dùng khoá phiên bản");
        body.put("email", email);
        body.put("password", PASSWORD);
        mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body))).andReturn();

        MvcResult login = mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", email, "password", PASSWORD)))).andReturn();
        token = json(login).at("/data/token").asText();
        return token;
    }

    private long createWallet(String balance) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/wallets")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                        "walletName", "Ví khoá phiên bản",
                        "type", "CASH",
                        "currency", "VND",
                        "balance", balance)))).andReturn();
        return json(result).at("/data/id").asLong();
    }

    private MvcResult expense(long walletId, String amount) throws Exception {
        return mvc.perform(post("/api/v1/transactions")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                        "walletId", walletId,
                        "actionTitle", "Chi song song",
                        "amount", amount,
                        "transactionType", "EXPENSE")))).andReturn();
    }

    private BigDecimal balanceOf(long walletId) {
        return walletRepository.findById(walletId)
                .orElseThrow()
                .getBalance();
    }

    @Test
    void versionColumnIsActuallyManagedByHibernate() throws Exception {
        loginNewUser();
        long walletId = createWallet("100000");
        assertThat(walletRepository.findById(walletId).orElseThrow().getVersion())
                .as("ví vừa tạo phải có phiên bản khởi đầu để lần ghi sau so sánh được").isZero();

        assertThat(expense(walletId, "10000").getResponse().getStatus()).isEqualTo(200);

        assertThat(walletRepository.findById(walletId).orElseThrow().getVersion())
                .as("mỗi lần đổi số dư phải tăng phiên bản").isOne();
    }

    @Test
    void writingAStaleWalletCopyIsRejectedInsteadOfOverwritingTheBalance() throws Exception {
        loginNewUser();
        long walletId = createWallet("100000");

        // Bản copy này lấy trước khi giao dịch chạy — đúng trạng thái một request đã đọc số dư
        // rồi bị một request khác ghi đè trong thế giới cũ.
        Wallet stale = walletRepository.findById(walletId).orElseThrow();

        assertThat(expense(walletId, "10000").getResponse().getStatus()).isEqualTo(200);
        assertThat(balanceOf(walletId)).isEqualByComparingTo("90000");

        stale.setBalance(new BigDecimal("1234567"));
        assertThatThrownBy(() -> walletRepository.saveAndFlush(stale))
                .as("ghi bản cũ lên bản mới phải bị từ chối, không được âm thầm thắng")
                .isInstanceOf(OptimisticLockingFailureException.class);

        assertThat(balanceOf(walletId)).isEqualByComparingTo("90000");
    }

    @Test
    void concurrentExpensesNeverLoseAnUpdate() throws Exception {
        loginNewUser();
        long walletId = createWallet("100000");
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CyclicBarrier barrier = new CyclicBarrier(2);

        try {
            List<Callable<Integer>> jobs = new ArrayList<>();
            for (int i = 0; i < 2; i++) {
                jobs.add(() -> {
                    barrier.await();
                    return expense(walletId, "10000").getResponse().getStatus();
                });
            }
            List<Future<Integer>> futures = pool.invokeAll(jobs);

            int accepted = 0;
            List<Integer> statuses = new ArrayList<>();
            for (Future<Integer> future : futures) {
                int status = future.get();
                statuses.add(status);
                if (status == 200) {
                    accepted++;
                }
            }

            assertThat(statuses).as("bên thua cuộc phải nhận 409 hoặc thực hiện tuần tự an toàn, không được lỗi khác")
                    .isSubsetOf(200, 409);
            assertThat(accepted).as("ít nhất một giao dịch phải vào được").isPositive();
            assertThat(balanceOf(walletId))
                    .as("số dư phải khớp đúng số giao dịch được chấp nhận: " + statuses)
                    .isEqualByComparingTo(new BigDecimal(100000 - 10000L * accepted));
        } finally {
            pool.shutdown();
        }
    }

    @Test
    void lostRaceIsReportedAsConflictInTheSameEnvelope() {
        var response = apiExceptionHandler.handleOptimisticLock(
                new ObjectOptimisticLockingFailureException(Wallet.class.getName(), 7L));

        assertThat(response.getStatusCode().value()).isEqualTo(409);
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("thử lại");
        assertThat(response.getBody().getData()).isNull();
    }
}
