import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

import RatingStars from "./RatingStars.jsx";
import { getProductImage } from "../utils/assets.js";
import { toggleFavorite } from "../store/slices/favoritesSlice.js";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const favorites = useSelector((state) => state.favorites.items);
  const isFavorite = favorites.some((item) => item._id === product._id);

  const finalPrice = Number(product.finalPrice ?? product.price ?? 0);
  const priceFallback = Number(product.price ?? 0);
  const candidateOriginal =
    product.oldPrice && product.oldPrice > 0
      ? Number(product.oldPrice)
      : Number(
          product.basePrice && product.basePrice > 0
            ? product.basePrice
            : priceFallback
        );
  const promotionPercentRaw = Number(
    product.appliedPromotion?.discountPercent ?? 0
  );
  const hasPromotionPercent =
    Number.isFinite(promotionPercentRaw) && promotionPercentRaw > 0;
  const clampedPromotionPercent = hasPromotionPercent
    ? Math.min(99, Math.max(0.01, promotionPercentRaw))
    : 0;
  const roundedPromotionPercent = hasPromotionPercent
    ? Math.max(1, Math.round(promotionPercentRaw))
    : 0;
  const derivedOriginalFromPromotion =
    clampedPromotionPercent > 0 && finalPrice > 0
      ? Math.max(
          finalPrice,
          Math.round(finalPrice / (1 - clampedPromotionPercent / 100))
        )
      : null;
  const resolvedOriginalCandidate =
    candidateOriginal > finalPrice ? candidateOriginal : null;
  const originalPrice =
    (resolvedOriginalCandidate && resolvedOriginalCandidate > finalPrice
      ? resolvedOriginalCandidate
      : null) ||
    derivedOriginalFromPromotion ||
    (candidateOriginal > 0 ? candidateOriginal : finalPrice);
  const fallbackPercent =
    originalPrice > finalPrice && originalPrice > 0
      ? Math.max(
          1,
          Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
        )
      : 0;
  const rawDiscountPercent =
    product.effectiveDiscountPercent ?? product.discountPercent ?? 0;
  const normalizedRawPercent = Number.isFinite(rawDiscountPercent)
    ? Math.max(0, Math.round(rawDiscountPercent))
    : 0;
  const discountPercent =
    roundedPromotionPercent > 0
      ? roundedPromotionPercent
      : normalizedRawPercent > 0
      ? normalizedRawPercent
      : fallbackPercent;
  const hasDiscount =
    discountPercent > 0 && originalPrice > finalPrice && finalPrice >= 0;
  const imageSrc = getProductImage(
    product,
    "https://placehold.co/400x300?text=Coming+Soon"
  );

  const handleAddToCart = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    navigate(`/product/${product.slug}?select=1`);
  };

  const handleBuyNow = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    navigate(`/product/${product.slug}?buyNow=1`);
  };

  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(product));
    toast.success(
      isFavorite
        ? "Đã bỏ khỏi danh sách yêu thích"
        : "Đã thêm vào danh sách yêu thích"
    );
  };

  return (
    <div className="group relative flex h-full flex-col rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-2 sm:p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 overflow-hidden min-w-0 touch-manipulation select-none">
      {/* Discount badge — outside image container so it's never clipped */}
      {hasDiscount && (
        <span className="absolute left-1.5 top-1.5 sm:left-2.5 sm:top-2.5 z-10 rounded sm:rounded-lg bg-rose-600 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-white shadow-sm pointer-events-none">
          -{discountPercent}%
        </span>
      )}

      <div className="relative mb-2 sm:mb-2.5 overflow-hidden rounded-lg sm:rounded-xl bg-slate-50/80 p-2 sm:p-3 aspect-square flex items-center justify-center">
        <Link to={`/product/${product.slug}`} className="block h-full w-full">
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </Link>
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-pressed={isFavorite}
          className={`absolute right-1.5 top-1.5 sm:right-2 sm:top-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border bg-white/90 backdrop-blur-sm shadow-sm transition hover:scale-105 ${
            isFavorite
              ? "border-rose-200 text-rose-500 ring-1 ring-rose-100"
              : "border-slate-200 text-slate-400 hover:text-rose-500"
          }`}
          aria-label={
            isFavorite
              ? "Bỏ khỏi danh sách yêu thích"
              : "Thêm vào danh sách yêu thích"
          }
        >
          {isFavorite ? (
            <AiFillHeart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500" />
          ) : (
            <AiOutlineHeart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none truncate">
          {product.brand}
        </span>
        <Link
          to={`/product/${product.slug}`}
          className="mt-1 text-xs sm:text-sm md:text-base font-bold text-slate-900 leading-snug transition hover:text-blue-600 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]"
          title={product.name}
        >
          {product.name}
        </Link>

        <div className="mt-1 sm:mt-1.5 flex items-center justify-between gap-1 text-xs text-slate-500">
          <div className="flex items-center gap-1 min-w-0">
            <RatingStars rating={product.rating || 0} size={11} />
            <span className="text-[10px] sm:text-xs font-semibold text-slate-600 hidden sm:inline">
              {Number(product.rating || 5).toFixed(1)}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 shrink-0">
            {product.ratingCount || 0} đánh giá
          </span>
        </div>

        {product.options?.colors?.length > 1 && (
          <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center gap-1">
            <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-slate-600">
              {product.options.colors.length} màu
            </span>
            {product.options?.capacities?.length > 1 && (
              <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-slate-600">
                {product.options.capacities.length} bộ nhớ
              </span>
            )}
          </div>
        )}

        <div className="mt-1.5 sm:mt-2.5 flex flex-wrap items-baseline gap-1 sm:gap-1.5 min-w-0">
          <p className="text-xs sm:text-base md:text-lg lg:text-xl font-extrabold text-slate-950 tracking-tight leading-tight">
            {formatCurrency(finalPrice)}
          </p>
          {hasDiscount && (
            <p className="text-[9px] sm:text-xs text-slate-400 line-through truncate">
              {formatCurrency(originalPrice)}
            </p>
          )}
        </div>

        {product.appliedPromotion?.name ? (
          <p className="mt-1 text-[10px] sm:text-xs font-semibold text-emerald-600 truncate" title={product.appliedPromotion.name}>
            🎁 {product.appliedPromotion.name}
          </p>
        ) : null}

        <div className="mt-auto pt-2 sm:pt-3 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleBuyNow}
            className="flex-1 rounded-lg sm:rounded-xl bg-slate-900 py-1.5 sm:py-2.5 px-2 text-[11px] sm:text-xs font-bold text-white shadow-sm transition hover:bg-blue-600 active:scale-95 text-center truncate"
          >
            Mua ngay
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-slate-200 text-slate-700 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
            aria-label="Thêm vào giỏ hàng"
            title="Thêm vào giỏ hàng"
          >
            <span className="text-sm sm:text-base leading-none font-bold">+</span>
          </button>
        </div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    brand: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    imageUrl: PropTypes.string,
    category: PropTypes.string,
    price: PropTypes.number.isRequired,
    finalPrice: PropTypes.number,
    basePrice: PropTypes.number,
    oldPrice: PropTypes.number,
    effectiveDiscountPercent: PropTypes.number,
    discountPercent: PropTypes.number,
    rating: PropTypes.number,
    ratingCount: PropTypes.number,
    appliedPromotion: PropTypes.shape({
      name: PropTypes.string,
    }),
    options: PropTypes.shape({
      colors: PropTypes.arrayOf(PropTypes.string),
      capacities: PropTypes.arrayOf(PropTypes.string),
    }),
  }).isRequired,
};

export default ProductCard;
