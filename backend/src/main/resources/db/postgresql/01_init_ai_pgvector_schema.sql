-- ==============================================================================
-- Budglee AI Chatbot Platform: PostgreSQL Schema with pgvector
-- Phụ trách: AI & RAG Subsystem
-- Mô tả: Khởi tạo bảng lưu trữ hội thoại, tin nhắn, API Key cá nhân và Vector Store
-- ==============================================================================

-- 1. Kích hoạt extension vector và UUID
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Bảng lưu trữ API Key cá nhân của người dùng (BYOK - Bring Your Own Key)
-- Hỗ trợ cả người dùng đã đăng nhập (user_id) và khách vãng lai (session_id)
CREATE TABLE IF NOT EXISTS ai_user_api_keys (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL,
    session_id VARCHAR(120) NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'GEMINI', -- 'GEMINI' hoặc 'OPENAI'
    encrypted_key TEXT NOT NULL,                     -- Ciphertext mã hóa đối xứng AES-256-GCM
    masked_key VARCHAR(60) NOT NULL,                 -- Key đã che: AIzaSy••••••••8x1Z
    model_name VARCHAR(100) NULL DEFAULT 'gemini-1.5-flash',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_keys_user ON ai_user_api_keys(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_keys_session ON ai_user_api_keys(session_id) WHERE session_id IS NOT NULL;

-- 3. Bảng phiên hội thoại (Conversations)
CREATE TABLE IF NOT EXISTS chat_conversations (
    id VARCHAR(64) PRIMARY KEY,                      -- UUID dạng chuỗi
    user_id BIGINT NULL,                             -- Khóa liên kết với tài khoản Budglee (nếu có)
    session_id VARCHAR(120) NOT NULL,                -- Session UUID lưu tại localStorage
    title VARCHAR(255) NOT NULL DEFAULT 'Cuộc trò chuyện mới',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_conversations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_conv_session ON chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_updated ON chat_conversations(updated_at DESC);

-- 4. Bảng lưu trữ chi tiết tin nhắn (Chat Messages)
-- Hỗ trợ Sliding Window Memory lấy 10-15 tin nhắn gần nhất làm ngữ cảnh
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,                       -- 'user', 'assistant', 'system', 'tool'
    content TEXT NOT NULL,
    tool_calls JSONB NULL,                           -- Metadata chi tiết cuộc gọi tool (function name, args, result)
    tokens_used INT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created ON chat_messages(conversation_id, created_at ASC);

-- 5. Bảng danh mục tài liệu tri thức nội bộ (Knowledge Base Documents)
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(80) NOT NULL,                   -- 'POLICY', 'BRANCH_INFO', 'USER_GUIDE', 'PRICING'
    source_url VARCHAR(255) NULL,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng lưu trữ các đoạn văn bản (chunks) và Vector Embedding (RAG)
-- Kích thước vector 768 chuẩn Google text-embedding-004 (phù hợp Gemini API)
CREATE TABLE IF NOT EXISTS document_embeddings (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_content TEXT NOT NULL,
    chunk_index INT NOT NULL,
    embedding vector(768) NULL,                      -- 768 dimensions
    metadata JSONB NULL,                             -- Tag, keyword, category phục vụ hybrid search
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- HNSW Index (Hierarchical Navigable Small World) để tối ưu hóa truy vấn Cosine Similarity
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_hnsw 
ON document_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

