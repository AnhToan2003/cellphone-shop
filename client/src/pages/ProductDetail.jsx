import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import RatingStars from "../components/RatingStars.jsx";
import BackButton from "../components/BackButton.jsx";
import { addItem } from "../store/slices/cartSlice.js";
import { fetchProductBySlug } from "../store/slices/productSlice.js";
import { getAssetUrl, getProductImage } from "../utils/assets.js";
import { fetchProductReviews, createProductReview } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { FALLBACK_PRODUCTS } from "../data/fallbackProducts.js";

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
  const [searchParams] = useSearchParams();
  const isBuyNowIntent = searchParams.get("buyNow") === "1";
  const isSelectIntent = searchParams.get("select") === "1";
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
  const variantList = useMemo(() => {
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      return product.variants;
    }
    const fallback = FALLBACK_PRODUCTS.find(
      (p) => p.slug === slug || p.slug === product?.slug
    );
    return Array.isArray(fallback?.variants) ? fallback.variants : [];
  }, [product?.variants, product?.slug, slug]);

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
    if (colors.length && !selectedColor) {
      setSelectedColor(colors[0] || "");
    }
    if (capacities.length && !selectedCapacity) {
      setSelectedCapacity(capacities[0] || "");
    }
    setLastSelectedOption(null);
  }, [colors, capacities]);

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

  const colors = useMemo(() => {
    if (Array.isArray(product?.options?.colors) && product.options.colors.length > 0) {
      return product.options.colors;
    }
    const fallback = FALLBACK_PRODUCTS.find(
      (p) => p.slug === slug || p.slug === product?.slug
    );
    if (Array.isArray(fallback?.options?.colors) && fallback.options.colors.length > 0) {
      return fallback.options.colors;
    }
    const fromVariants = [...new Set(variantList.map((v) => v.color).filter(Boolean))];
    return fromVariants;
  }, [product?.options?.colors, product?.slug, slug, variantList]);

  const capacities = useMemo(() => {
    if (Array.isArray(product?.options?.capacities) && product.options.capacities.length > 0) {
      return product.options.capacities;
    }
    const fallback = FALLBACK_PRODUCTS.find(
      (p) => p.slug === slug || p.slug === product?.slug
    );
    if (Array.isArray(fallback?.options?.capacities) && fallback.options.capacities.length > 0) {
      return fallback.options.capacities;
    }
    const fromVariants = [...new Set(variantList.map((v) => v.capacity).filter(Boolean))];
    return fromVariants;
  }, [product?.options?.capacities, product?.slug, slug, variantList]);

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
    const colorSpecificImages = [];
    const fallbackImages = [];

    const pushUnique = (list, image) => {
      if (!image || typeof image !== "string") return;
      const resolved = getAssetUrl(image);
      if (!resolved || seen.has(resolved)) return;
      seen.add(resolved);
      list.push(resolved);
    };

    // 1. Check colorImages dictionary from product.options
    if (selectedColor && product?.options?.colorImages) {
      const normalizedSel = normalizeVariantValue(selectedColor);
      let directColorImages =
        product.options.colorImages[selectedColor] ||
        product.options.colorImages[normalizedSel] ||
        null;

      if (!directColorImages) {
        // Case-insensitive key match
        const foundKey = Object.keys(product.options.colorImages).find(
          (k) => normalizeVariantValue(k) === normalizedSel
        );
        if (foundKey) {
          directColorImages = product.options.colorImages[foundKey];
        }
      }

      if (Array.isArray(directColorImages) && directColorImages.length > 0) {
        directColorImages.forEach((img) => pushUnique(colorSpecificImages, img));
      }
    }

    // 2. Check activeVariant images (color + capacity match)
    if (Array.isArray(activeVariant?.images) && activeVariant.images.length > 0) {
      activeVariant.images.forEach((img) => pushUnique(colorSpecificImages, img));
    }

    // 3. Check any variant with matching color
    if (selectedColor && colorSpecificImages.length === 0) {
      const normalizedSelected = normalizeVariantValue(selectedColor);
      variantList
        .filter((v) => normalizeVariantValue(v?.color) === normalizedSelected)
        .forEach((v) => {
          if (Array.isArray(v.images) && v.images.length > 0) {
            v.images.forEach((img) => pushUnique(colorSpecificImages, img));
          }
        });
    }

    // If color-specific images are found, return ONLY those images!
    if (colorSpecificImages.length > 0) {
      return colorSpecificImages;
    }

    // Fallback: general product gallery and main cover image
    if (Array.isArray(product?.images)) {
      product.images.forEach((img) => pushUnique(fallbackImages, img));
    }
    pushUnique(fallbackImages, product?.imageUrl);

    return fallbackImages.length > 0
      ? fallbackImages
      : [PRODUCT_IMAGE_PLACEHOLDER];
  }, [
    activeVariant?.images,
    selectedColor,
    variantList,
    product?.options?.colorImages,
    product?.images,
    product?.imageUrl,
  ]);

  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
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

    if (availableStock < 1) {
      toast.error("Biến thể đã chọn hiện hết hàng");
      return false;
    }

    if (quantity > availableStock) {
      toast.error(`Chỉ còn ${availableStock} sản phẩm cho biến thể đã chọn`);
      return false;
    }

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
        availableStock,
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

  if (selectedStatus === "loading" || (selectedStatus === "idle" && !product)) {
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

  if (!product) {
    return (
      <div className="container-safe py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Không tải được sản phẩm</h1>
          <p className="mt-3 text-sm text-slate-600">
            Vui lòng thử lại. Nếu sản phẩm đã bị gỡ, bạn có thể quay về danh sách.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => dispatch(fetchProductBySlug(slug))}
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Thử tải lại
            </button>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Xem sản phẩm khác
            </button>
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
  const availableStock = Math.max(
    0,
    Number(activeVariant?.stock ?? product.stock ?? 0)
  );

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

  const defaultPromotions = "Tặng củ sạc nhanh Apple 20W USB-C chính hãng trị giá 490.000₫\nTặng ốp lưng MagSafe chống sốc & Dán cường lực KingKong cao cấp\nGiảm thêm 500.000₫ khi tham gia Thu cũ đổi mới (Trade-in)\nGiảm 20% khi mua kèm phụ kiện AirPods / Apple Watch\nHỗ trợ trả góp 0% lãi suất qua CCCD hoặc thẻ tín dụng";

  const rawPromotions =
    typeof product?.promotionsPolicy === "string" && product.promotionsPolicy.trim()
      ? product.promotionsPolicy.trim()
      : defaultPromotions;

  const giftItems = rawPromotions
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const defaultWarranty = `Bảo hành ${product?.warrantyMonths || 12} tháng chính hãng tại Ngọc Triết Store.\nLỗi 1 đổi 1 trong 30 ngày nếu phát sinh lỗi nhà sản xuất.\nMiễn phí vệ sinh máy & dán lại cường lực trọn đời.`;

  const rawWarranty =
    typeof product?.warrantyPolicy === "string" && product.warrantyPolicy.trim()
      ? product.warrantyPolicy.trim()
      : defaultWarranty;

  const warrantyItems = rawWarranty
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="container-safe py-4 sm:py-12">
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

      <div className="mt-8 grid min-w-0 gap-12 lg:grid-cols-2">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-2xl bg-white p-6 shadow">
            <img
              src={
                galleryImages[activeImageIndex] ||
                getProductImage(product, PRODUCT_IMAGE_PLACEHOLDER)
              }
              alt={product.name}
              className="mx-auto h-64 sm:h-96 w-full max-w-full object-contain"
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

        <div className="min-w-0">
          <h1 className="break-words text-xl sm:text-3xl font-extrabold text-slate-900">{product.name}</h1>
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
            <span>{availableStock > 0 ? "Còn hàng" : "Hết hàng"}</span>
          </div>

          <div className="mt-4 sm:mt-6 rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-baseline gap-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {currency(finalPrice)}
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

          <div className="mt-4 sm:mt-6 space-y-5 rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
            {/* Direct Buying / Cart guidance alert */}
            {isBuyNowIntent && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-50/80 p-3 text-xs sm:text-sm text-blue-900 flex items-center gap-2 shadow-sm animate-fade-in-up">
                <span className="text-base shrink-0">👉</span>
                <span>
                  Vui lòng chọn <strong>Màu sắc &amp; Dung lượng</strong> bạn muốn mua bên dưới, sau đó nhấn <strong>Mua ngay</strong> để tiếp tục thanh toán.
                </span>
              </div>
            )}
            {isSelectIntent && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-50/80 p-3 text-xs sm:text-sm text-blue-900 flex items-center gap-2 shadow-sm animate-fade-in-up">
                <span className="text-base shrink-0">🛒</span>
                <span>
                  Vui lòng chọn <strong>Màu sắc &amp; Dung lượng</strong> trước khi thêm vào giỏ hàng.
                </span>
              </div>
            )}

            {colors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Màu sắc
                  </h3>
                  {selectedColor && (
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      Đã chọn: <strong className="font-bold">{selectedColor}</strong>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((color) => {
                    const active = color === selectedColor;
                    const colorThumb =
                      product?.options?.colorImages?.[color]?.[0] ||
                      variantList.find((v) => v.color === color && v.images?.length > 0)?.images?.[0] ||
                      null;

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setLastSelectedOption("color");
                          setSelectedColor(color);
                          setActiveImageIndex(0);
                        }}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                          active
                            ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-105"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {colorThumb && (
                          <img
                            src={getAssetUrl(colorThumb)}
                            alt={color}
                            className="h-4 w-4 rounded-full object-cover border border-white/40"
                          />
                        )}
                        <span>{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {capacities.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Dung lượng
                  </h3>
                  {selectedCapacity && (
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      Đã chọn: <strong className="font-bold">{selectedCapacity}</strong>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {capacities.map((capacity) => {
                    const selectable = isCapacitySelectable(capacity);
                    const active = selectable && capacity === selectedCapacity;
                    const capVariant = findVariantMatch(variantList, selectedColor, capacity);
                    const capStock =
                      capVariant?.stock !== null && capVariant?.stock !== undefined
                        ? Number(capVariant.stock)
                        : null;
                    const isCapOutOfStock = capStock !== null && capStock <= 0;

                    return (
                      <button
                        key={capacity}
                        type="button"
                        onClick={() => {
                          if (!selectable) return;
                          setLastSelectedOption("capacity");
                          setSelectedCapacity(capacity);
                        }}
                        disabled={!selectable || isCapOutOfStock}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                          active
                            ? "border-slate-950 bg-slate-950 text-white shadow-md scale-105"
                            : isCapOutOfStock
                            ? "border-rose-200 bg-rose-50/50 text-rose-400 line-through"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        <span>{capacity}</span>
                        {isCapOutOfStock && (
                          <span className="text-[10px] text-rose-500 font-normal no-underline">(Hết)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-slate-900">Số lượng</h3>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1 || availableStock < 1}
                    className="h-10 w-10 text-xl font-semibold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Giảm số lượng"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-base font-semibold">
                    {availableStock < 1 ? 0 : quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((prev) => Math.min(availableStock, prev + 1))
                    }
                    disabled={quantity >= availableStock || availableStock < 1}
                    className="h-10 w-10 text-xl font-semibold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Tăng số lượng"
                  >
                    +
                  </button>
                </div>
                {availableStock > 0 ? (
                  <p className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Còn <strong className="font-bold text-emerald-700">{availableStock}</strong> sản phẩm sẵn hàng
                  </p>
                ) : (
                  <p className="text-sm font-bold text-rose-600 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Tạm hết hàng cho phiên bản này
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={availableStock < 1}
                className="flex-1 rounded-xl border-2 border-slate-900 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {availableStock < 1 ? "Tạm hết hàng" : "Thêm vào giỏ hàng"}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={availableStock < 1}
                className="flex-1 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                {availableStock < 1 ? "Tạm hết hàng" : "Mua ngay"}
              </button>
            </div>
          </div>

          {/* ƯU ĐÃI & QUÀ TẶNG KÈM VIP */}
          <div className="mt-6 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm text-base">
                  🎁
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Ưu Đãi Đặc Quyền &amp; Quà Tặng
                  </h3>
                  <p className="text-xs text-amber-800">
                    Áp dụng khi mua tại Ngọc Triết Store
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
                VIP Gifts
              </span>
            </div>

            <div className="mt-3.5 space-y-2">
              {giftItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-[10px]">
                    ✓
                  </span>
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CHÍNH SÁCH BẢO HÀNH CHÍNH HÃNG */}
          <div className="mt-4 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/60 via-white to-slate-50/40 p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm text-base">
                  🛡️
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Chính Sách Bảo Hành Chính Hãng
                  </h3>
                  <p className="text-xs text-blue-700">
                    Ngọc Triết Store - Cam kết uy tín &amp; tận tâm
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-300">
                {product?.warrantyMonths ? `${product.warrantyMonths} Tháng` : "12 Tháng"}
              </span>
            </div>

            <div className="mt-3.5 space-y-2">
              {warrantyItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-[10px]">
                    ✓
                  </span>
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <span>⚡</span> Đổi mới 30 ngày đầu lỗi NSX
              </span>
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <span>✨</span> Vệ sinh &amp; dán skin trọn đời
              </span>
            </div>
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
