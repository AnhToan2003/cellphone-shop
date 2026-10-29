import { useEffect, useRef, useState } from "react";
import { FiPhoneCall, FiX } from "react-icons/fi";
import { SiZalo } from "react-icons/si";

const HOTLINE_NUMBER = "0395554268";
const HOTLINE_DISPLAY = "039 555 4268";
const ZALO_LINK = `https://zalo.me/${HOTLINE_NUMBER}`;

export default function PhoneContactPopup() {
  const [open, setOpen] = useState(false);
  const popupRef = useRef(null);

  // Close when tapping/clicking anywhere outside
  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <>
      {/* Full-screen backdrop: tap anywhere outside on mobile or desktop to close immediately */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[1px] transition-opacity duration-200"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        ref={popupRef}
        aria-label="Liên hệ nhanh"
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-3.5 sm:bottom-6 sm:right-6 z-30 flex flex-col items-end gap-3 select-none"
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

        {/* Main circular floating action button (FAB) */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={open ? "Đóng menu liên hệ" : "Gọi ngay Hotline 039 555 4268"}
          className={`group relative flex items-center justify-center rounded-full font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 h-14 w-14 sm:h-16 sm:w-16 ${
            open
              ? "bg-slate-800 shadow-slate-700/50 hover:bg-slate-700"
              : "bg-blue-600 shadow-blue-500/60 hover:bg-blue-500"
          }`}
        >
          {/* Pulsing halo ring when closed */}
          {!open && (
            <span className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-30 pointer-events-none" />
          )}

          {open ? (
            <FiX size={26} className="text-white transition-transform duration-200" />
          ) : (
            <span className="relative flex h-7 w-7 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
              <FiPhoneCall size={24} className="relative sm:h-7 sm:w-7 text-white" />
            </span>
          )}
        </button>
      </aside>
    </>
  );
}
