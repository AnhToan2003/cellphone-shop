import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import { getAssetUrl } from "../utils/assets.js";

const FALLBACK_SLIDE = {
  id: "fallback",
  title: "Ngọc Triết Store – Chuyên Thiết Bị Apple",
  subtitle:
    "Trải nghiệm hệ sinh thái Apple đỉnh cao: iPhone, iPad, MacBook, Apple Watch và phụ kiện chính hãng.",
  imageUrl:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80",
  link: "/products",
  ctaLabel: "Khám phá ngay",
};

const HIGHLIGHT_STATS = [
  { label: "Tiêu chuẩn", value: "Apple VN" },
  { label: "Chất lượng", value: "100% Zin" },
  { label: "Bảo hành", value: "1 Đổi 1" },
];


const resolveSlides = (slides = []) => {
  if (!Array.isArray(slides) || !slides.length) {
    return [FALLBACK_SLIDE];
  }

  return slides
    .filter(Boolean)
    .slice(0, 3)
    .map((slide, index) => {
      const entry =
        slide && typeof slide === "object" ? slide : { description: slide };

      return {
        id: entry.id || entry._id || `slide-${index}`,
        title: entry.title || entry.sentence || FALLBACK_SLIDE.title,
        subtitle:
          entry.subtitle ||
          entry.description ||
          entry.sentence ||
          FALLBACK_SLIDE.subtitle,
        imageUrl: entry.imageUrl || entry.image || FALLBACK_SLIDE.imageUrl,
        link: entry.link || "",
        ctaLabel: entry.ctaLabel || FALLBACK_SLIDE.ctaLabel,
      };
    });
};

const Banner = ({ slides, autoPlay = true, interval = 6000, onSlideNavigate }) => {
  const preparedSlides = useMemo(() => resolveSlides(slides), [slides]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [preparedSlides]);

  useEffect(() => {
    if (!autoPlay || preparedSlides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % preparedSlides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, preparedSlides.length]);

  const goTo = (nextIndex) => {
    setIndex(() => {
      if (nextIndex < 0) {
        return preparedSlides.length - 1;
      }
      if (nextIndex >= preparedSlides.length) {
        return 0;
      }
      return nextIndex;
    });
  };

  const handleNavigate = () => {
    const currentSlide = preparedSlides[index] || FALLBACK_SLIDE;
    if (typeof onSlideNavigate === "function") {
      onSlideNavigate(currentSlide);
    }
  };

  const currentSlide = preparedSlides[index] || FALLBACK_SLIDE;
  const resolvedImage = getAssetUrl(currentSlide.imageUrl);

  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-[32px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-xl">
      {/* Subtle ambient lighting */}
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 p-4 sm:p-8">
        {/* Split Card: Left Info (60%) — Right Device Image (40%) */}
        <div className="grid grid-cols-[1.15fr,0.85fr] sm:grid-cols-2 lg:grid-cols-[1.2fr,0.8fr] items-center gap-3 sm:gap-8">
          {/* Left Column: Content */}
          <div className="flex flex-col justify-center space-y-1.5 sm:space-y-3 min-w-0">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-400/30 px-2 sm:px-3 py-0.5 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                Ngọc Triết Store • Apple Specialist
              </span>
            </div>

            <h1 className="text-sm sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight line-clamp-2 leading-snug">
              {currentSlide.title}
            </h1>

            {currentSlide.subtitle ? (
              <p className="text-[11px] sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                {currentSlide.subtitle}
              </p>
            ) : null}

            {/* Highlight Badges */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 pt-0.5">
              {HIGHLIGHT_STATS.map((stat) => (
                <span
                  key={stat.label}
                  className="inline-flex items-center gap-1 rounded-md sm:rounded-lg bg-white/10 px-1.5 sm:px-2.5 py-0.5 text-[9px] sm:text-xs font-semibold text-slate-200"
                >
                  <span className="text-blue-400 font-bold">{stat.value}</span>
                  <span className="text-slate-400 hidden sm:inline">• {stat.label}</span>
                </span>
              ))}
            </div>

            {currentSlide.ctaLabel ? (
              <div className="pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={handleNavigate}
                  className="rounded-lg sm:rounded-xl bg-blue-600 px-3.5 py-1.5 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-95 shrink-0 inline-flex items-center gap-1.5"
                >
                  <span>{currentSlide.ctaLabel}</span>
                  <span className="text-xs sm:text-sm leading-none">→</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* Right Column: Hero Device Image */}
          <div className="relative flex items-center justify-center h-full min-h-[130px] sm:min-h-[220px]">
            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl transform scale-75 pointer-events-none" />
            <img
              src={resolvedImage}
              alt={currentSlide.title}
              className="relative z-10 max-h-[140px] sm:max-h-[240px] lg:max-h-[280px] w-auto max-w-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] transition duration-500 hover:scale-105 rounded-xl sm:rounded-2xl"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>

        {/* Dots Indicator */}
        {preparedSlides.length > 1 && (
          <div className="flex justify-center gap-1.5 pt-3 sm:pt-4">
            {preparedSlides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(slideIndex)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  slideIndex === index
                    ? "w-6 bg-white shadow"
                    : "w-1.5 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Chuyển đến slide ${slideIndex + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

Banner.propTypes = {
  slides: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      subtitle: PropTypes.string,
      imageUrl: PropTypes.string,
      link: PropTypes.string,
      ctaLabel: PropTypes.string,
    })
  ),
  autoPlay: PropTypes.bool,
  interval: PropTypes.number,
  onSlideNavigate: PropTypes.func,
};

export default Banner;

