import { useEffect, useRef, useState } from "react";
import { FiHeadphones, FiSend } from "react-icons/fi";
import { toast } from "react-hot-toast";

import { sendSupportMessage } from "../services/api.js";

const MAX_HISTORY = 12;
const INITIAL_GREETING = {
  id: "assistant-welcome",
  role: "assistant",
  content:
    "Xin chào! Mình là Trợ lý Cellphone Shop. Bạn cần hỗ trợ đơn hàng, sản phẩm hay ưu đãi nào hôm nay?",
};

const limitMessages = (entries = []) =>
  Array.isArray(entries) ? entries.slice(-MAX_HISTORY) : [];

const SupportChatbox = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(() =>
    limitMessages([INITIAL_GREETING])
  );

  const scrollRef = useRef(null);
  const lastSubmitRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const handleToggle = () => setOpen((prev) => !prev);

  const handleSend = async (event) => {
    event?.preventDefault?.();
    if (isSending) return;

    const now = Date.now();
    if (now - lastSubmitRef.current < 900) return;

    const trimmed = input.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập nội dung cần hỗ trợ.");
      return;
    }

    const userMessage = {
      id: `local-${now}`,
      role: "user",
      content: trimmed,
    };

    const pendingMessages = limitMessages([...messages, userMessage]);
    setMessages(pendingMessages);
    setInput("");
    setIsSending(true);
    lastSubmitRef.current = now;

    try {
      const response = await sendSupportMessage({
        messages: pendingMessages.map(({ role, content }) => ({ role, content })),
      });

      let replyContent = "";
      if (response?.data?.success && response?.data?.reply) {
        // Preferred Ollama response shape
        replyContent = response.data.reply;
      } else if (response?.data?.data?.content) {
        replyContent = response.data.data.content;
      } else if (response?.data?.content) {
        replyContent = response.data.content;
      } else {
        throw new Error("Không nhận được phản hồi từ server");
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: replyContent,
      };

      setMessages(limitMessages([...pendingMessages, assistantMessage]));
      lastSubmitRef.current = Date.now();
    } catch (error) {
      console.error("sendSupportMessage error:", error);

      let errorMsg = "Không thể kết nối tới trợ lý. Vui lòng thử lại.";
      if (error?.response?.status === 503) {
        errorMsg = "Ollama chưa được khởi động. Vui lòng chạy: ollama serve";
      } else if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.message) {
        errorMsg = error.message;
      }

      const errorMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `[Lỗi] ${errorMsg}`,
      };

      setMessages(limitMessages([...pendingMessages, errorMessage]));
      setInput(trimmed);
      toast.error(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-brand-primary/50 transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <FiHeadphones size={18} />
        {open ? "Đóng hỗ trợ" : "Hỗ trợ khách hàng"}
      </button>

      {open ? (
        <div className="fixed bottom-24 right-6 z-40 w-full max-w-sm rounded-3xl border border-white/70 bg-white/95 shadow-2xl shadow-slate-900/20 backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Trợ lý Cellphone Shop
              </p>
              <p className="text-xs text-emerald-500">Trực tuyến</p>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:border-brand-primary hover:text-brand-primary"
            >
              Thu gọn
            </button>
          </div>

          <div
            ref={scrollRef}
            className="max-h-96 space-y-3 overflow-y-auto px-4 py-4 text-sm"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === "assistant"
                      ? "bg-slate-100 text-slate-800"
                      : "bg-brand-primary text-white"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isSending ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-4 py-2 text-slate-500">
                  Trợ lý đang trả lời...
                </div>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-slate-200 px-4 py-3"
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Gửi tin nhắn"
            >
              <FiSend size={18} />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
};

export default SupportChatbox;
