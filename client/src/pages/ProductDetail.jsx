import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import RatingStars from "../components/RatingStars.jsx";
import BackButton from "../components/BackButton.jsx";
import { addItem } from "../store/slices/cartSlice.js";
import { fetchProductBySlug } from "../store/slices/productSlice.js";
import { getAssetUrl, getProductImage } from "../utils/assets.js";
import { fetchProductReviews, createProductReview } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const currency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const normalizeVariantValue = (value) =>
  value === undefined || value === null
    ? ""
    : value.toString().trim().toLowerCase();

const findVariantMatch = (variants = [], color = "", capacity = "") => {
  if (!Array.isArray(variants) || variants.length === 0) return null;

  const targetColor = normalizeVariantValue(color);
  const targetCapacity = normalizeVariantValue(capacity);

  const matches = variants.map((variant) => ({
    variant,
    color: normalizeVariantValue(variant?.color),
    capacity: normalizeVariantValue(variant?.capacity),
  }));

  const directMatch = matches.find(({ color, capacity }) => {
    const colorMatches = targetColor ? color === targetColor : true;
    const capacityMatches = targetCapacity ? capacity === targetCapacity : true;
    return colorMatches && capacityMatches;
  });
  if (directMatch) return directMatch.variant;

  if (targetColor) {
    const colorMatch = matches.find(
      ({ color }) => color === targetColor
    );
    if (colorMatch) return colorMatch.variant;
  }

  if (targetCapacity) {
    const capacityMatch = matches.find(
      ({ capacity }) => capacity === targetCapacity
    );
    if (capacityMatch) return capacityMatch.variant;
  }

  const defaultVariant = matches.find(
    ({ color, capacity }) => !color && !capacity
  );
  return defaultVariant ? defaultVariant.variant : matches[0]?.variant ?? null;
};

const PRODUCT_IMAGE_PLACEHOLDER =
  "https://placehold.co/600x400?text=H%C3%ACnh+%E1%BA%A3nh";
const CART_IMAGE_PLACEHOLDER =
  "https://placehold.co/400x300?text=Coming+Soon";

const ProductDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { selected: product, selectedStatus } = useSelector(
    (state) => state.products
  );

  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedCapacity, setSelectedCapacity] = useState("");
  const [lastSelectedOption, setLastSelectedOption] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({
    total: 0,
    average: 0,
    canReview: false,
  });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const variantList = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants : []),
    [product?.variants]
  );

  const {
    capacitiesByColor,
    colorsByCapacity,
    combinationSet: variantCombinationSet,
  } = useMemo(() => {
    const mapByColor = new Map();
    const mapByCapacity = new Map();
    const combinationSet = new Set();

    variantList.forEach((variant) => {
      const rawColor =
        typeof variant?.color === "string" ? variant.color : "";
      const rawCapacity =
        typeof variant?.capacity === "string" ? variant.capacity : "";

      const normalizedColor = normalizeVariantValue(rawColor);
      const normalizedCapacity = normalizeVariantValue(rawCapacity);

      if (normalizedColor || normalizedCapacity) {
        combinationSet.add(`${normalizedColor}__${normalizedCapacity}`);
      }

      if (normalizedColor && rawCapacity) {
        const existingCapacities = mapByColor.get(normalizedColor) || [];
        const hasCapacity = existingCapacities.some(
          (value) => normalizeVariantValue(value) === normalizedCapacity
        );
        if (!hasCapacity) {
          mapByColor.set(normalizedColor, [
            ...existingCapacities,
            rawCapacity,
          ]);
        }
      }

      if (normalizedCapacity && rawColor) {
        const existingColors = mapByCapacity.get(normalizedCapacity) || [];
        const hasColor = existingColors.some(
          (value) => normalizeVariantValue(value) === normalizedColor
        );
        if (!hasColor) {
          mapByCapacity.set(normalizedCapacity, [
            ...existingColors,
            rawColor,
          ]);
        }
      }
    });

    return {
      capacitiesByColor: mapByColor,
      colorsByCapacity: mapByCapacity,
      combinationSet,
    };
  }, [variantList]);

  const activeVariant = useMemo(
    () =>
      findVariantMatch(
        variantList,
        selectedColor || "",
        selectedCapacity || ""
      ),
    [variantList, selectedColor, selectedCapacity]
  );


  useEffect(() => {
    if (slug) {
      dispatch(fetchProductBySlug(slug));
    }
  }, [dispatch, slug]);

  useEffect(() => {
    if (!product) return;
    const colors = Array.isArray(product.options?.colors)
      ? product.options.colors
      : [];
    const capacities = Array.isArray(product.options?.capacities)
      ? product.options.capacities
      : [];
    setSelectedColor(colors[0] || "");
    setSelectedCapacity(capacities[0] || "");
    setLastSelectedOption(null);
  }, [product?._id]);

  useEffect(() => {
    let active = true;
    if (!slug) return;

    const loadReviews = async () => {
      setLoadingReviews(true);
      try {
        const { data } = await fetchProductReviews(slug);
        if (!active) return;
        setReviews(Array.isArray(data?.data) ? data.data : []);
        setReviewMeta(
          data?.meta || { total: 0, average: 0, canReview: false }
        );
      } catch (error) {
        if (active) {
          setReviews([]);
          setReviewMeta({ total: 0, average: 0, canReview: false });
        }
      } finally {
        if (active) setLoadingReviews(false);
      }
    };

    loadReviews();
    return () => {
      active = false;
    };
  }, [slug]);

  const colors = useMemo(
    () => (Array.isArray(product?.options?.colors) ? product.options.colors : []),
    [product?.options?.colors]
  );
  const capacities = useMemo(
    () =>
      Array.isArray(product?.options?.capacities)
        ? product.options.capacities
        : [],
    [product?.options?.capacities]
  );

  useEffect(() => {
    if (!selectedColor || lastSelectedOption === "capacity") {
      return;
    }
    const normalizedColor = normalizeVariantValue(selectedColor);
    const availableCapacities = capacitiesByColor.get(normalizedColor);
    if (!availableCapacities || availableCapacities.length === 0) {
      return;
    }
    const normalizedCapacity = normalizeVariantValue(selectedCapacity);
    const hasCapacity = availableCapacities.some(
      (value) => normalizeVariantValue(value) === normalizedCapacity
    );
    if (!hasCapacity) {
      setSelectedCapacity(availableCapacities[0] || "");
      if (lastSelectedOption !== null) {
        setLastSelectedOption(null);
      }
    }
  }, [
    capacitiesByColor,
    lastSelectedOption,
    selectedCapacity,
    selectedColor,
  ]);

  useEffect(() => {
    if (!selectedCapacity || lastSelectedOption === "color") {
      return;
    }
    const normalizedCapacity = normalizeVariantValue(selectedCapacity);
    const availableColors = colorsByCapacity.get(normalizedCapacity);
    if (!availableColors || availableColors.length === 0) {
      return;
    }
    const normalizedColor = normalizeVariantValue(selectedColor);
    const hasColor = availableColors.some(
      (value) => normalizeVariantValue(value) === normalizedColor
    );
    if (!hasColor) {
      setSelectedColor(availableColors[0] || "");
      if (lastSelectedOption !== null) {
        setLastSelectedOption(null);
      }
    }
  }, [
    colorsByCapacity,
    lastSelectedOption,
    selectedCapacity,
    selectedColor,
  ]);

  const galleryImages = useMemo(() => {
    const seen = new Set();
    const uniqueImages = [];
    const pushImage = (image) => {
      if (!image || typeof image !== "string") return;
      const resolved = getAssetUrl(image);
      if (!resolved || seen.has(resolved)) return;
      seen.add(resolved);
      uniqueImages.push(resolved);
    };

    if (Array.isArray(activeVariant?.images)) {
      activeVariant.images.forEach(pushImage);
    }

    if (Array.isArray(product?.images)) {
      product.images.forEach(pushImage);
    }

    pushImage(product?.imageUrl);
    return uniqueImages;
  }, [activeVariant?.images, product?.images, product?.imageUrl]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?._id, selectedColor, selectedCapacity]);

  useEffect(() => {
    if (!galleryImages.length && activeImageIndex !== 0) {
      setActiveImageIndex(0);
    } else if (
      galleryImages.length > 0 &&
      activeImageIndex >= galleryImages.length
    ) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, galleryImages.length]);

  const isCapacitySelectable = (capacityValue) => {
    if (
      !selectedColor ||
      !variantCombinationSet ||
      variantCombinationSet.size === 0
    ) {
      return true;
    }
    const key = `${normalizeVariantValue(
      selectedColor
    )}__${normalizeVariantValue(capacityValue)}`;
    return variantCombinationSet.has(key);
  };

  const handleAddToCart = () => {
    if (!product) return false;

    if (colors.length && !selectedColor) {
      toast.error("Vui lòng chọn màu sắc");
      return false;
    }

    if (capacities.length && !selectedCapacity) {
      toast.error("Vui lòng chọn dung lượng");
      return false;
    }

    const selectedImage =
      galleryImages[activeImageIndex] ||
      getProductImage(product, CART_IMAGE_PLACEHOLDER);
    const imageSrc = selectedImage || CART_IMAGE_PLACEHOLDER;
    dispatch(
      addItem({
        id: product._id,
        name: product.name,
        slug: product.slug,
        price: finalPrice,
        image: imageSrc,
        quantity,
        selectedColor: selectedColor || null,
        selectedCapacity: selectedCapacity || null,
      })
    );
    toast.success("Đã thêm vào giỏ hàng");
    return true;
  };

  const handleBuyNow = () => {
    if (handleAddToCart()) {
      navigate("/checkout");
    }
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!product) return;

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đánh giá");
      return;
    }

    if (!reviewMeta.canReview) {
      toast.error("Bạn chỉ có thể đánh giá sau khi đã mua hàng");
      return;
    }

    try {
      setSubmittingReview(true);
      const { data } = await createProductReview(product.slug, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success("Cảm ơn bạn đã đánh giá!");
      const currentRating = reviewForm.rating;
      setReviewForm({ rating: 5, comment: "" });

      try {
        const refreshed = await fetchProductReviews(product.slug);
        setReviews(refreshed.data.data);
        setReviewMeta(refreshed.data.meta);
      } catch (refreshError) {
        console.error("Failed to refresh reviews:", refreshError);
        setReviews((prev) => [data.data, ...prev]);
        setReviewMeta((prev) => ({
          ...prev,
          total: (prev.total || 0) + 1,
          average: Number(
            (
              ((prev.average || 0) * (prev.total || 0) + currentRating) /
              ((prev.total || 0) + 1)
            ).toFixed(2)
          ),
          canReview: false,
        }));
      }
    } catch (error) {
      const message =
        error?.response?.data?.message || "Không thể gửi đánh giá";
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (selectedStatus === "loading" || !product) {
    return (
      <div className="container-safe py-16">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl bg-white" />
          <div className="space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded bg-white" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-white" />
            <div className="h-32 animate-pulse rounded bg-white" />
          </div>
        </div>
      </div>
    );
  }

  const basePrice = Number(product?.price ?? 0);
  const baseFinalPrice = Number(
    product?.finalPrice ?? (basePrice > 0 ? basePrice : 0)
  );
  const variantBasePrice = Number(
    activeVariant?.price !== undefined && activeVariant?.price !== null
      ? activeVariant.price
      : basePrice
  );
  const discountFactor =
    basePrice > 0 && baseFinalPrice > 0
      ? Math.max(0, baseFinalPrice) / basePrice
      : 1;

  const computedFinalPrice =
    discountFactor > 0 && discountFactor < 1
      ? Math.max(0, Math.round(variantBasePrice * discountFactor))
      : variantBasePrice;

  const finalPrice = Number.isFinite(computedFinalPrice)
    ? computedFinalPrice
    : variantBasePrice;

  let comparePrice = Number(product?.oldPrice ?? 0);
  if (!comparePrice && discountFactor < 1) {
    comparePrice = variantBasePrice;
  }
  const promotionPercentRaw = Number(
    product?.appliedPromotion?.discountPercent ?? 0
  );
  const hasPromotionPercent =
    Number.isFinite(promotionPercentRaw) && promotionPercentRaw > 0;
  const clampedPromotionPercent = hasPromotionPercent
    ? Math.min(99, Math.max(0.01, promotionPercentRaw))
    : 0;
  const roundedPromotionPercent = hasPromotionPercent
    ? Math.max(1, Math.round(promotionPercentRaw))
    : 0;
  if (hasPromotionPercent && finalPrice > 0) {
    const derivedCompare = Math.round(
      finalPrice / (1 - clampedPromotionPercent / 100)
    );
    if (derivedCompare > comparePrice) {
      comparePrice = derivedCompare;
    }
  }

  const fallbackDiscount =
    comparePrice > finalPrice && comparePrice > 0
      ? Math.max(
          0,
          Math.round(((comparePrice - finalPrice) / comparePrice) * 100)
        )
      : 0;
  const effectiveDiscount =
    roundedPromotionPercent > 0
      ? roundedPromotionPercent
      : fallbackDiscount ||
        product.effectiveDiscountPercent ||
        product.discountPercent ||
        0;

  const warrantyPolicy =
    typeof product?.warrantyPolicy === "string" && product.warrantyPolicy.trim()
      ? product.warrantyPolicy.trim()
      : "Lỗi 1 đổi 1 trong 10 ngày. Bảo hành 12 tháng. Không bảo hành khi rơi vỡ hoặc vào nước.";

  return (
    <div className="container-safe py-12">
      <BackButton
        wrapperClassName="mb-4"
        variant="neutral"
        alwaysVisible
        className="border-slate-200 bg-white text-slate-700 shadow-sm"
      />
      <nav className="text-sm text-slate-500">
        <span className="hover:text-brand-primary">Trang chủ</span>
        <span className="mx-2">/</span>
        <span className="hover:text-brand-primary">Điện thoại</span>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-2xl bg-white p-6 shadow">
            <img
              src={
                galleryImages[activeImageIndex] ||
                getProductImage(product, PRODUCT_IMAGE_PLACEHOLDER)
              }
              alt={product.name}
              className="mx-auto h-96 object-contain"
            />
          </div>
          {galleryImages.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {galleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`rounded-xl border-2 p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 ${
                    activeImageIndex === index
                      ? "border-brand-primary shadow-sm"
                      : "border-transparent hover:border-slate-300"
                  }`}
                  aria-label={`Xem ảnh ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
          <p className="mt-2 text-sm uppercase tracking-wide text-slate-400">
            {product.brand}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <RatingStars
              rating={reviewMeta.average || product.rating || 0}
              size={18}
            />
            <span>
              {(reviewMeta.total || product.ratingCount || 0).toLocaleString("vi-VN")}{" "}
              đánh giá
            </span>
            <span>|</span>
            <span>{(product.views || 0).toLocaleString("vi-VN")} lượt xem</span>
            <span>|</span>
            <span>{product.stock > 0 ? "Còn hàng" : "Hết hàng"}</span>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-6 shadow">
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold text-brand-primary">
                ${currency(finalPrice)}
              </p>
              {comparePrice > finalPrice && (
                <>
                  <p className="text-sm text-slate-400 line-through">
                    {currency(comparePrice)}
                  </p>
                  {effectiveDiscount > 0 && (
                    <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                      Tiết kiệm {effectiveDiscount}%
                    </span>
                  )}
                </>
              )}
            </div>
            {product.appliedPromotion?.name ? (
              <p className="mt-2 text-sm text-emerald-400">
                Áp dụng: {product.appliedPromotion.name}
              </p>
            ) : null}
            {product.description && (
              <p className="mt-4 text-sm text-slate-600">{product.description}</p>
            )}
          </div>

          <div className="mt-6 space-y-6 rounded-2xl bg-white p-6 shadow">
            {colors.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">Chọn màu sắc</h3>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => {
                    const active = color === selectedColor;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setLastSelectedOption("color");
                          setSelectedColor(color);
                        }}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? "border-brand-primary bg-brand-primary text-white"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-primary hover:text-brand-primary"
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {capacities.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">Chọn dung lượng</h3>
                <div className="flex flex-wrap gap-2">
                  {capacities.map((capacity) => {
                    const selectable = isCapacitySelectable(capacity);
                    const active = selectable && capacity === selectedCapacity;
                    return (
                      <button
                        key={capacity}
                        type="button"
                        onClick={() => {
                          if (!selectable) return;
                          setLastSelectedOption("capacity");
                          setSelectedCapacity(capacity);
                        }}
                        disabled={!selectable}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          active
                            ? "border-brand-primary bg-brand-primary text-white"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-primary hover:text-brand-primary"
                        }`}
                      >
                        {capacity}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-slate-900">Số lượng</h3>
              <div className="mt-4 flex items-center gap-4">
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="h-10 w-10 text-xl font-semibold text-slate-600"
                    aria-label="Giảm số lượng"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-base font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="h-10 w-10 text-xl font-semibold text-slate-600"
                    aria-label="Tăng số lượng"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-slate-500">
                  {product.stock} sản phẩm trong kho
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 rounded-full border border-brand-primary px-6 py-3 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
              >
                Thêm vào giỏ hàng
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Mua ngay
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-slate-900">Chính sách bảo hành</h2>
            <p className="mt-2 text-sm text-slate-600">{warrantyPolicy}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-500">
              <li>Lỗi kỹ thuật được đổi mới trong 10 ngày đầu.</li>
              <li>Bảo hành tối đa 12 tháng tại hệ thống cửa hàng.</li>
              <li>Không bảo hành nếu sản phẩm rơi vỡ hoặc vào nước.</li>
            </ul>
          </div>

          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="mt-6 rounded-2xl bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-slate-900">
                Thông số nổi bật
              </h3>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-slate-50 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-400">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-700">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Đánh giá sản phẩm</h3>
            <p className="text-sm text-slate-500">
              Trung bình {(reviewMeta.average || product.rating || 0).toFixed(1)} / 5 ({
                reviewMeta.total || product.ratingCount || 0
              } lượt đánh giá)
            </p>
          </div>
        </div>

        {isAuthenticated && reviewMeta.canReview ? (
          <form
            onSubmit={handleSubmitReview}
            className="mt-6 space-y-4 rounded-2xl bg-slate-50 p-5"
          >
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm font-semibold text-slate-700" htmlFor="rating">
                Đánh giá của bạn
              </label>
              <select
                id="rating"
                value={reviewForm.rating}
                onChange={(event) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    rating: Number(event.target.value),
                  }))
                }
                className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} sao
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={(event) =>
                setReviewForm((prev) => ({ ...prev, comment: event.target.value }))
              }
              rows={4}
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
            <button
              type="submit"
              disabled={submittingReview}
              className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand-dark/50"
            >
              {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            {isAuthenticated
              ? "Bạn đã đánh giá sản phẩm này hoặc chưa đủ điều kiện đánh giá."
              : "Đăng nhập để chia sẻ đánh giá của bạn."}
          </div>
        )}

        <div className="mt-8 space-y-4">
          {loadingReviews ? (
            <p className="text-sm text-slate-500">Đang tải danh sách đánh giá...</p>
          ) : reviews.length ? (
            reviews.map((review) => (
              <div
                key={review._id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {review.user?.name || review.user?.email || "Người dùng"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(review.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <RatingStars rating={review.rating} size={16} />
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-slate-600">{review.comment}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Chưa có đánh giá nào cho sản phẩm này.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;
