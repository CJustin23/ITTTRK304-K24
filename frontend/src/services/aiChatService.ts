import axios from 'axios';
import { useStore } from '../store/useStore';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

export interface ToolConfirmation {
  confirmationId: string;
  toolName: string;
  title: string;
  description: string;
  amount?: number;
  walletName?: string;
  categoryName?: string;
  note?: string;
  actionType?: string;
  parameters?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  confirmation?: ToolConfirmation | null;
  statusText?: string;
  isStreaming?: boolean;
}

export interface AiKeyStatus {
  hasKey: boolean;
  provider?: string;
  maskedKey?: string;
  modelName?: string;
}

export const AiChatService = {
  getSessionId(): string {
    let sid = localStorage.getItem('budglee_ai_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('budglee_ai_session_id', sid);
    }
    return sid;
  },

  getConversationId(): string {
    let cid = localStorage.getItem('budglee_ai_conv_id');
    if (!cid) {
      cid = 'conv_' + this.getSessionId().substring(0, 8) + '_' + Date.now();
      localStorage.setItem('budglee_ai_conv_id', cid);
    }
    return cid;
  },

  resetConversation(): string {
    const newCid = 'conv_' + this.getSessionId().substring(0, 8) + '_' + Date.now();
    localStorage.setItem('budglee_ai_conv_id', newCid);
    return newCid;
  },

  async fetchHistory(conversationId: string): Promise<ChatMessage[]> {
    try {
      const token = useStore.getState().token;
      const res = await axios.get(`${API_BASE_URL}/ai/history`, {
        params: { conversationId },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map((m: any, idx: number) => ({
          id: `hist_${idx}_${m.timestamp || Date.now()}`,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp || Date.now(),
          confirmation: m.confirmation,
        }));
      }
    } catch (e) {
      console.warn('Lỗi tải lịch sử chat:', e);
    }
    return [];
  },

  async getKeyStatus(): Promise<AiKeyStatus> {
    try {
      const token = useStore.getState().token;
      const res = await axios.get(`${API_BASE_URL}/ai/keys/status`, {
        params: { sessionId: this.getSessionId() },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data?.data || { hasKey: false };
    } catch (e) {
      return { hasKey: false };
    }
  },

  async saveApiKey(provider: string, apiKey: string, modelName?: string): Promise<AiKeyStatus> {
    const token = useStore.getState().token;
    const res = await axios.post(
      `${API_BASE_URL}/ai/keys`,
      {
        sessionId: this.getSessionId(),
        provider,
        apiKey,
        modelName,
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return res.data?.data;
  },

  async deleteApiKey(): Promise<void> {
    const token = useStore.getState().token;
    await axios.delete(`${API_BASE_URL}/ai/keys`, {
      params: { sessionId: this.getSessionId() },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async confirmToolAction(confirmationId: string): Promise<any> {
    const token = useStore.getState().token;
    const res = await axios.post(
      `${API_BASE_URL}/ai/tools/confirm`,
      { confirmationId },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return res.data?.data;
  },

  /**
   * Gọi SSE Streaming để hiển thị câu trả lời từng chữ mượt mà.
   */
  async streamChat(
    message: string,
    conversationId: string,
    callbacks: {
      onToken: (token: string) => void;
      onStatus?: (status: string) => void;
      onToolConfirm?: (confirmation: ToolConfirmation) => void;
      onDone: (convId: string) => void;
      onError: (errorMsg: string) => void;
    }
  ): Promise<void> {
    const token = useStore.getState().token;
    const sessionId = this.getSessionId();

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          conversationId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Máy chủ phản hồi mã lỗi: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Trình duyệt không hỗ trợ ReadableStream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          const blockLines = block.split('\n');
          let eventName = 'message';
          let eventData = '';

          for (const line of blockLines) {
            if (line.startsWith('event:')) {
              eventName = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              eventData = line.substring(5).trim();
            }
          }

          if (eventData) {
            try {
              const parsed = JSON.parse(eventData);
              if (eventName === 'token') {
                callbacks.onToken(parsed.token || '');
              } else if (eventName === 'status') {
                callbacks.onStatus?.(parsed.status || '');
              } else if (eventName === 'tool_confirmation') {
                callbacks.onToolConfirm?.(parsed);
              } else if (eventName === 'done') {
                callbacks.onDone(parsed.conversationId || conversationId);
              } else if (eventName === 'error') {
                callbacks.onError(parsed.message || 'Đã có lỗi xảy ra');
              }
            } catch (err) {
              // Bỏ qua lỗi parse JSON dòng lẻ
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Lỗi kết nối SSE Chatbot:', err);
      callbacks.onError(err?.message || 'Không thể kết nối đến Trợ lý AI. Vui lòng thử lại!');
    }
  },
};

