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
  const [scrollMeta, setScrollMeta] = useState({
    atTop: true,
    atBottom: true,
  });

  const scrollRef = useRef(null);
  const lastSubmitRef = useRef(0);
  const scrollFrameRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  const refreshScrollMeta = () => {
    const container = scrollRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const atTop = scrollTop <= 8;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 8;

    setScrollMeta((prev) =>
      prev.atTop === atTop && prev.atBottom === atBottom
        ? prev
        : { atTop, atBottom }
    );
  };

  useEffect(
    () => () => {
      if (scrollFrameRef.current) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    scrollToBottom(messages.length <= 2 ? "auto" : "smooth");
    refreshScrollMeta();
  }, [messages, open]);

  const handleScroll = () => {
    if (scrollFrameRef.current) {
      cancelAnimationFrame(scrollFrameRef.current);
    }
    scrollFrameRef.current = requestAnimationFrame(refreshScrollMeta);
  };

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
        className="group fixed bottom-6 right-6 z-40 flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-brand-primary via-brand-light to-brand-dark px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-brand-primary/40 transition hover:translate-y-[-2px] hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 lg:right-10"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/15 opacity-0 blur-lg transition duration-300 group-hover:opacity-70" />
        <span className="absolute inset-0 rounded-full ring-1 ring-white/30 opacity-60" />
        <span className="relative flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <FiHeadphones size={18} />
          </span>
          {open ? "Đang hỗ trợ" : "Hỗ trợ khách hàng"}
        </span>
      </button>

      {open ? (
        <div className="fixed bottom-24 right-6 z-40 w-full max-w-sm drop-shadow-2xl lg:right-10">
          <div className="motion-panel relative overflow-hidden rounded-4xl border border-white/70 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur-lg">
            <div
              className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white/85"
              aria-hidden
            />
            <div
              className="absolute -left-10 -top-16 h-32 w-32 rounded-full bg-brand-accent/40 blur-3xl"
              aria-hidden
            />
            <div
              className="absolute -right-14 bottom-10 h-40 w-40 rounded-full bg-aurora/30 blur-3xl"
              aria-hidden
            />
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-brand-primary via-brand-light to-brand-dark" />

            <div className="relative flex flex-col gap-3">
              <div className="flex items-center justify-between px-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-brand-primary via-brand-light to-brand-dark text-white shadow-lg shadow-brand-primary/20">
                    <span
                      className="absolute inset-0 rounded-2xl border border-white/40 opacity-70"
                      aria-hidden
                    />
                    <FiHeadphones size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Trợ lý Cellphone Shop
                    </p>
                    <div className="flex items-center gap-2 text-xs text-emerald-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Online · phản hồi nhanh</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggle}
                  className="rounded-full border border-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-brand-primary hover:text-brand-primary"
                >
                  Thu gọn
                </button>
              </div>

              <p className="px-4 text-xs text-slate-500">
                Vuốt lên xuống để xem lịch sử trò chuyện hoặc bổ sung thêm chi tiết.
              </p>

              <div className="relative px-3">
                <div
                  className={`pointer-events-none absolute inset-x-3 top-0 h-12 bg-gradient-to-b from-white via-white/80 to-transparent transition-opacity duration-300 ${scrollMeta.atTop ? "opacity-0" : "opacity-100"}`}
                  aria-hidden
                />
                <div
                  className={`pointer-events-none absolute inset-x-3 bottom-16 h-12 bg-gradient-to-t from-white via-white/80 to-transparent transition-opacity duration-300 ${scrollMeta.atBottom ? "opacity-0" : "opacity-100"}`}
                  aria-hidden
                />

                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="relative max-h-[25rem] space-y-3 overflow-y-auto rounded-3xl bg-white/80 px-3 py-3 text-sm shadow-inner shadow-white/30 backdrop-blur-sm transition duration-300 scroll-smooth touch-pan-y snap-y"
                >
                  {messages.map((message) => {
                    const isAssistant = message.role === "assistant";
                    return (
                      <div
                        key={message.id}
                        className={`flex snap-start ${isAssistant ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`chat-bubble-animate relative max-w-[82%] rounded-3xl px-4 py-3 leading-relaxed shadow-lg ${
                            isAssistant
                              ? "border border-white/70 bg-white/90 text-slate-800"
                              : "bg-gradient-to-r from-brand-primary via-brand-light to-brand-dark text-white shadow-brand-primary/25"
                          }`}
                        >
                          <span
                            className={`mb-1 block text-[10px] uppercase tracking-[0.14em] ${
                              isAssistant ? "text-slate-500" : "text-white/80"
                            }`}
                          >
                            {isAssistant ? "Trợ lý" : "Bạn"}
                          </span>
                          <div className="whitespace-pre-line">{message.content}</div>
                        </div>
                      </div>
                    );
                  })}

                  {isSending ? (
                    <div className="flex justify-start snap-start">
                      <div className="chat-bubble-animate flex items-center gap-2 rounded-3xl border border-white/70 bg-white/90 px-4 py-3 text-slate-500 shadow-lg">
                        <span className="chat-typing-dot" />
                        <span className="chat-typing-dot" />
                        <span className="chat-typing-dot" />
                        <span className="text-xs font-semibold text-slate-500">
                          Trợ lý đang gõ...
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <form
                onSubmit={handleSend}
                className="flex flex-col gap-2 border-t border-white/70 bg-white/85 px-4 py-3 backdrop-blur"
              >
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50/80 px-3 py-2 shadow-inner shadow-white/40 ring-1 ring-slate-200">
                  <input
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Nhập câu hỏi hoặc mô tả nhu cầu của bạn..."
                    className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={isSending}
                    className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-brand-primary via-brand-light to-brand-dark text-white shadow-lg shadow-brand-primary/25 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Gửi tin nhắn"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 transition duration-300 hover:opacity-40" />
                    <FiSend size={18} className="relative" />
                  </button>
                </div>
                <p className="px-1 text-[11px] text-slate-400">
                  Chia sẻ càng chi tiết, trợ lý càng gợi ý nhanh và chính xác.
                </p>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default SupportChatbox;
