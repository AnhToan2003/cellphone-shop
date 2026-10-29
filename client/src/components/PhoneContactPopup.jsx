import { useState } from "react";
import { FiPhoneCall, FiX } from "react-icons/fi";
import { SiZalo } from "react-icons/si";

const HOTLINE_NUMBER = "0395554268";
const HOTLINE_DISPLAY = "039 555 4268";
const ZALO_LINK = `https://zalo.me/${HOTLINE_NUMBER}`;

export default function PhoneContactPopup() {
  const [open, setOpen] = useState(false);

  return (
    <aside
      aria-label="Liên hệ nhanh"
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-3.5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2.5 sm:gap-3 select-none"
    >
      {/* Expanded contact panel */}
      {open && (
        <div className="flex flex-col gap-2.5 sm:gap-3 animate-fade-in-up">
          {/* Phone call button */}
          <a
            href={`tel:${HOTLINE_NUMBER}`}
            className="group flex items-center gap-3 rounded-2xl bg-blue-600 px-4 py-3 sm:px-5 sm:py-3.5 text-white shadow-2xl shadow-blue-500/40 transition-all duration-200 hover:scale-105 hover:bg-blue-500"
            title={`Gọi ${HOTLINE_DISPLAY}`}
          >
            <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
              <FiPhoneCall size={18} className="relative text-white" />
            </span>
            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200">
                Gọi ngay
              </p>
              <p className="text-sm sm:text-base font-extrabold tracking-wide">
                {HOTLINE_DISPLAY}
              </p>
            </div>
          </a>

          {/* Zalo button */}
          <a
            href={ZALO_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-blue-400/40 bg-slate-900 px-4 py-3 sm:px-5 sm:py-3.5 text-white shadow-2xl shadow-slate-900/40 transition-all duration-200 hover:scale-105 hover:bg-slate-800"
            title="Nhắn tin Zalo"
          >
            <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow">
              <SiZalo size={15} className="sm:h-4 sm:w-4" />
            </span>
            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Chat Zalo
              </p>
              <p className="text-xs sm:text-sm font-bold text-white">Nhắn tin ngay</p>
            </div>
          </a>
        </div>
      )}

      {/* Main toggle button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "Đóng" : "Gọi ngay"}
        className={`group relative flex items-center justify-center gap-2 overflow-hidden rounded-full font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 px-4 py-3 sm:px-6 sm:py-3.5 min-h-[46px] ${
          open
            ? "bg-slate-800 shadow-slate-700/40 hover:bg-slate-700"
            : "bg-blue-600 shadow-blue-500/50 hover:bg-blue-500 hover:shadow-blue-500/70"
        }`}
      >
        {/* Pulsing ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-25 pointer-events-none" />
        )}
        <span className="relative flex items-center gap-2">
          {open ? (
            <FiX size={20} className="sm:h-5 sm:w-5" />
          ) : (
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
              <FiPhoneCall size={18} className="relative sm:h-5 sm:w-5" />
            </span>
          )}
          <span className="text-xs sm:text-sm font-bold tracking-wide">
            {open ? "Đóng" : "Gọi ngay"}
          </span>
        </span>
      </button>
    </aside>
  );
}
