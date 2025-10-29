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

  const finalPrice = product.finalPrice ?? product.price;
  const originalPrice =
    product.oldPrice && product.oldPrice > 0
      ? product.oldPrice
      : product.basePrice ?? product.price;
  const discountPercent =
    product.effectiveDiscountPercent ?? product.discountPercent ?? 0;
  const hasDiscount = discountPercent > 0 && originalPrice > finalPrice;
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
    <div className="group flex h-full flex-col rounded-xl bg-white p-4 shadow transition duration-200 hover:-translate-y-1 hover:shadow-card">
      <div className="relative mb-3 overflow-hidden rounded-lg bg-slate-100">
        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-primary px-2 py-1 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        )}
        <Link to={`/product/${product.slug}`} className="block">
          <img
            src={imageSrc}
            alt={product.name}
            className="h-56 w-full object-contain transition group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-pressed={isFavorite}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow transition ${
            isFavorite
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-white text-brand-primary hover:bg-brand-primary hover:text-white"
          }`}
          aria-label={
            isFavorite
              ? "Bỏ khỏi danh sách yêu thích"
              : "Thêm vào danh sách yêu thích"
          }
        >
          {isFavorite ? <AiFillHeart size={18} /> : <AiOutlineHeart size={18} />}
        </button>
      </div>

      <div className="flex flex-1 flex-col">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {product.brand}
        </span>
        <Link
          to={`/product/${product.slug}`}
          className="mt-2 text-base font-semibold text-slate-900 transition hover:text-brand-primary line-clamp-2"
        >
          {product.name}
        </Link>

        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <RatingStars rating={product.rating || 0} />
          <span>{product.ratingCount || 0} đánh giá</span>
        </div>

        <div className="mt-3">
          <p className="text-xl font-bold text-brand-primary">
            {formatCurrency(finalPrice)}
          </p>
          {hasDiscount && (
            <p className="text-sm text-slate-400 line-through">
              {formatCurrency(originalPrice)}
            </p>
          )}
        </div>

        {product.appliedPromotion?.name ? (
          <p className="mt-2 text-xs text-emerald-500">
            Áp dụng: {product.appliedPromotion.name}
          </p>
        ) : null}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleBuyNow}
            className="flex-1 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Mua ngay
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-primary text-brand-primary transition hover:bg-brand-primary hover:text-white"
            aria-label="Thêm vào giỏ"
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
