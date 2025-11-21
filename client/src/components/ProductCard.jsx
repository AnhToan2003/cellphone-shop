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
    <div className="group flex h-full flex-col rounded-3xl border border-white/60 bg-white/90 p-5 shadow-card backdrop-blur transition duration-300 hover:-translate-y-1.5 hover:shadow-glass">
      <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-100">
        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-primary/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-halo">
            -{discountPercent}%
          </span>
        )}
        <Link to={`/product/${product.slug}`} className="block">
          <img
            src={imageSrc}
            alt={product.name}
            className="h-60 w-full object-contain transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-pressed={isFavorite}
          className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border bg-white text-brand-primary shadow-lg transition hover:-translate-y-0.5 ${
            isFavorite
              ? "border-brand-primary ring-2 ring-brand-primary/40"
              : "border-white/70 hover:border-brand-primary"
          }`}
          aria-label={
            isFavorite
              ? "Bỏ khỏi danh sách yêu thích"
              : "Thêm vào danh sách yêu thích"
          }
        >
          {isFavorite ? (
            <AiFillHeart size={18} className="text-brand-primary" />
          ) : (
            <AiOutlineHeart size={18} />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary/70">
          {product.brand}
        </span>
        <Link
          to={`/product/${product.slug}`}
          className="mt-2 text-lg font-semibold text-slate-900 transition hover:text-brand-primary line-clamp-2"
        >
          {product.name}
        </Link>

        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
          <RatingStars rating={product.rating || 0} />
          <span>{product.ratingCount || 0} đánh giá</span>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <p className="text-2xl font-bold text-gradient">
            {formatCurrency(finalPrice)}
          </p>
          {hasDiscount && (
            <p className="text-sm text-slate-400 line-through">
              {formatCurrency(originalPrice)}
            </p>
          )}
        </div>

        {product.appliedPromotion?.name ? (
          <p className="mt-2 text-xs font-semibold text-emerald-500">
            Áp dụng: {product.appliedPromotion.name}
          </p>
        ) : null}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={handleBuyNow}
            className="flex-1 rounded-full bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-halo transition hover:-translate-y-0.5 hover:bg-brand-dark"
          >
            Mua ngay
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-primary text-brand-primary transition hover:bg-brand-primary hover:text-white"
            aria-label="Thêm vào giỏ hàng"
          >
            +
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
  }).isRequired,
};

export default ProductCard;
