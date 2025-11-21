import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import { getAssetUrl } from "../utils/assets.js";

const FALLBACK_SLIDE = {
  id: "fallback",
  title: "Chào mừng đến Cellphone Shop",
  subtitle:
    "Khám phá smartphone cao cấp, giao nhanh toàn quốc và nhiều chương trình ưu đãi độc quyền.",
  imageUrl:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80",
  link: "",
  ctaLabel: "Xem sản phẩm",
};

const HIGHLIGHT_STATS = [
  { label: "Flagship hot", value: "50+" },
  { label: "Flash sale", value: "12h/lần" },
  { label: "Ưu đãi", value: "Độc quyền" },
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
    setIndex((prev) => {
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
    <section className="relative overflow-hidden rounded-[36px] border border-white/40 bg-gradient-to-br from-brand-primary via-rose-500 to-brand-dark text-white shadow-glass">
      <div className="banner-pan absolute inset-0">
        <img
          src={resolvedImage}
          alt={currentSlide.title}
          className="h-full w-full object-cover opacity-50 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent" />
      </div>

      <div className="relative grid gap-10 p-8 lg:grid-cols-[1.1fr,0.9fr] lg:gap-12 lg:p-12">
        <div className="flex flex-col justify-center space-y-6">
          <div className="pill-badge w-fit bg-white/15 text-white banner-pill">
            <span className="tracking-[0.4em]">Focus</span>
            {preparedSlides.length > 1 && (
              <span>
                {index + 1}/{preparedSlides.length}
              </span>
            )}
          </div>
          <h1 className="banner-title font-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
            {currentSlide.title}
          </h1>
          {currentSlide.subtitle ? (
            <p className="banner-subtitle max-w-xl text-base text-white/85">
              {currentSlide.subtitle}
            </p>
          ) : null}

          <div className="grid gap-4 text-left text-white/90 sm:grid-cols-3">
            {HIGHLIGHT_STATS.map((stat, statIndex) => (
              <div
                key={stat.label}
                className="banner-stat rounded-2xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur"
                style={{ animationDelay: `${statIndex * 0.15}s` }}
              >
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.3em]">{stat.label}</p>
              </div>
            ))}
          </div>

          {currentSlide.ctaLabel ? (
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleNavigate}
                className="banner-cta inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-light hover:text-white"
              >
                {currentSlide.ctaLabel}
              </button>
              {preparedSlides.length > 1 && (
                <div className="flex items-center gap-3 rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.4em]">
                  Slide
                  <span className="text-base font-semibold text-white">
                    {index + 1}
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="relative flex items-center justify-center">
          <span className="absolute inset-4 rounded-[32px] border border-white/20 bg-white/10 blur-3xl" />
          <div className="banner-device relative w-full rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur">
            <div className="relative flex h-[280px] items-center justify-center rounded-[24px] bg-gradient-to-br from-white/70 to-white/10">
              <img
                src={resolvedImage}
                alt={currentSlide.title}
                className="h-full w-full object-contain drop-shadow-glow"
              />
            </div>
            <p className="mt-4 text-sm text-white/80">
              Quét mã QR để nhận voucher độc quyền và giao nhanh trong 2 giờ.
            </p>
          </div>

          {preparedSlides.length > 1 && (
            <div className="absolute -bottom-4 hidden w-max items-center gap-3 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs backdrop-blur sm:flex">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                className="rounded-full border border-white/40 px-3 py-1 text-white transition hover:bg-white/20"
                aria-label="Slide trước"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                className="rounded-full border border-white/40 px-3 py-1 text-white transition hover:bg-white/20"
                aria-label="Slide tiếp theo"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {preparedSlides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {preparedSlides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goTo(slideIndex)}
              className={`h-2.5 w-8 rounded-full transition ${
                slideIndex === index
                  ? "bg-white"
                  : "bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Chuyển đến slide ${slideIndex + 1}`}
            />
          ))}
        </div>
      )}
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

