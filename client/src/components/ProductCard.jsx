import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

import RatingStars from "./RatingStars.jsx";
import { addItem } from "../store/slices/cartSlice.js";
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

  const handleAddToCart = () => {
    dispatch(
      addItem({
        id: product._id,
        name: product.name,
        slug: product.slug,
        price: finalPrice,
        image: imageSrc,
        availableStock: product.stock,
      })
    );
    toast.success("Đã thêm vào giỏ hàng");
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
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
    <div className="group relative flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
      {/* Discount badge — outside image container so it's never clipped */}
      {hasDiscount && (
        <span className="absolute left-3 top-3 z-10 rounded-lg bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-md pointer-events-none">
          -{discountPercent}%
        </span>
      )}

      <div className="relative mb-3 overflow-hidden rounded-xl bg-slate-50 p-4 aspect-square flex items-center justify-center">
        <Link to={`/product/${product.slug}`} className="block h-full w-full">
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-pressed={isFavorite}
          className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full border bg-white shadow-sm transition hover:scale-105 ${
            isFavorite
              ? "border-rose-200 text-rose-500 ring-2 ring-rose-100"
              : "border-slate-200 text-slate-400 hover:text-rose-500"
          }`}
          aria-label={
            isFavorite
              ? "Bỏ khỏi danh sách yêu thích"
              : "Thêm vào danh sách yêu thích"
          }
        >
          {isFavorite ? (
            <AiFillHeart size={18} className="text-rose-500" />
          ) : (
            <AiOutlineHeart size={18} />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {product.brand}
        </span>
        <Link
          to={`/product/${product.slug}`}
          className="mt-1.5 text-base font-bold text-slate-900 transition hover:text-blue-600 line-clamp-2"
        >
          {product.name}
        </Link>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <RatingStars rating={product.rating || 0} />
          <span className="text-[11px] font-medium">{product.ratingCount || 0} đánh giá</span>
        </div>

        {product.options?.colors?.length > 1 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {product.options.colors.length} màu sắc
            </span>
            {product.options?.capacities?.length > 1 && (
              <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {product.options.capacities.length} dung lượng
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <p className="text-xl font-extrabold text-slate-950">
            {formatCurrency(finalPrice)}
          </p>
          {hasDiscount && (
            <p className="text-xs text-slate-400 line-through">
              {formatCurrency(originalPrice)}
            </p>
          )}
        </div>

        {product.appliedPromotion?.name ? (
          <p className="mt-1 text-xs font-semibold text-emerald-600">
            🎁 {product.appliedPromotion.name}
          </p>
        ) : null}

        <div className="mt-4 flex gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBuyNow}
            className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white shadow transition hover:bg-blue-600"
          >
            Mua ngay
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
            aria-label="Thêm vào giỏ hàng"
          >
            <span className="text-lg leading-none font-bold">+</span>
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
