import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import { getAssetUrl } from "../utils/assets.js";

const FALLBACK_SLIDE = {
  id: "fallback",
  title: "Chào mừng đến Cellphone Shop",
  subtitle:
    "Khám phá smartphone cao cấp, giao nhanh toàn quốc và nhiều chương trình trả góp linh hoạt cho mọi flagship mới nhất.",
  imageUrl:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80",
  link: "",
  ctaLabel: "Xem sản phẩm",
};

const resolveSlides = (slides = []) => {
  if (!Array.isArray(slides) || !slides.length) {
    return [FALLBACK_SLIDE];
  }

  return slides
    .filter(Boolean)
    .slice(0, 3)
    .map((slide, index) => ({
      id: slide.id || slide._id || `slide-${index}`,
      title: slide.title || slide.sentence || FALLBACK_SLIDE.title,
      subtitle: slide.subtitle || slide.description || FALLBACK_SLIDE.subtitle,
      imageUrl: slide.imageUrl || slide.image || FALLBACK_SLIDE.imageUrl,
      link: slide.link || "",
      ctaLabel: slide.ctaLabel || FALLBACK_SLIDE.ctaLabel,
    }));
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
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <img
        src={resolvedImage}
        alt={currentSlide.title}
        className="h-[320px] w-full object-cover md:h-[380px]"
      />

      {preparedSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow transition hover:bg-white"
            aria-label="Slide trước"
          >
            {"<"}
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow transition hover:bg-white"
            aria-label="Slide tiếp theo"
          >
            {">"}
          </button>
        </>
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent">
        <div className="flex h-full flex-col justify-center px-6 py-10 sm:px-10">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-white/60">
            <span>Sự kiện nổi bật</span>
            {preparedSlides.length > 1 && (
              <span>
                {index + 1}/{preparedSlides.length}
              </span>
            )}
          </div>
          <h1 className="mt-4 max-w-xl text-3xl font-bold text-white sm:text-5xl">
            {currentSlide.title}
          </h1>
          {currentSlide.subtitle ? (
            <p className="mt-4 max-w-lg text-sm text-slate-200 sm:text-base">
              {currentSlide.subtitle}
            </p>
          ) : null}
          {currentSlide.ctaLabel ? (
            <button
              type="button"
              onClick={handleNavigate}
              className="mt-6 inline-flex w-fit items-center rounded-full bg-white/95 px-5 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-white"
            >
              {currentSlide.ctaLabel}
            </button>
          ) : null}
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
