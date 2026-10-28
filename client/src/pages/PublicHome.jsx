import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import Banner from "../components/Banner.jsx";
import ProductCard from "../components/ProductCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { fetchProducts, setFilters } from "../store/slices/productSlice.js";
import { normalizeText } from "../utils/text.js";
import { getProductImage, getAssetUrl } from "../utils/assets.js";
import { apiClient } from "../api/axios.js";
import { fetchPublicCategories } from "../services/api.js";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80";
const HERO_SUBTITLE =
  "Ưu đãi độc quyền, giao nhanh toàn quốc và nhiều chương trình trả góp linh hoạt cho từng flagship mới nhất.";

const APPLE_FULL_CATALOG = [
  {
    id: "",
    label: "Tất cả sản phẩm",
    icon: "🍎",
    subCategories: [],
  },
  {
    id: "iPhone",
    label: "iPhone",
    icon: "📱",
    subCategories: [
      "iPhone 16 Series",
      "iPhone 15 Series",
      "iPhone 14 Series",
      "iPhone 13 Series",
      "iPhone 12 & Cũ hơn",
    ],
  },
  {
    id: "iPad",
    label: "iPad",
    icon: "📟",
    subCategories: [
      "iPad Pro",
      "iPad Air",
      "iPad Gen",
      "iPad Mini",
    ],
  },
  {
    id: "Mac",
    label: "Mac & MacBook",
    icon: "💻",
    subCategories: [
      "MacBook Pro",
      "MacBook Air",
      "iMac & Mac Mini",
    ],
  },
  {
    id: "Apple Watch",
    label: "Apple Watch",
    icon: "⌚",
    subCategories: [
      "Apple Watch Ultra",
      "Apple Watch Series",
      "Apple Watch SE",
    ],
  },
  {
    id: "Phụ kiện",
    label: "Phụ kiện Apple",
    icon: "🎧",
    subCategories: [
      "Tai nghe & AirPods",
      "Củ sạc & Cáp sạc",
      "Ốp lưng & Bao da",
      "Apple Pencil & Bàn phím",
    ],
  },
];

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const resolveProductPrices = (product) => {
  if (!product) {
    return { finalPrice: 0, originalPrice: null };
  }
  const finalPrice = Number(product.finalPrice ?? product.price ?? 0);
  const originalCandidates = [
    product.oldPrice,
    product.price,
    product.basePrice,
  ]
    .map((value) =>
      typeof value === "number" && Number.isFinite(value) ? value : null
    )
    .filter((value) => value !== null);
  const originalPrice =
    originalCandidates.find((value) => value > finalPrice) || null;
  return { finalPrice, originalPrice };
};

const EXPERIENCE_FEATURES = [
  {
    title: "Flash sale mỗi ngày",
    subtitle: "Cập nhật lúc 12:00 và 20:00 với số lượng giới hạn.",
    pill: "Deal hot",
  },
  {
    title: "Thu cũ đổi mới",
    subtitle: "Định giá minh bạch, nhận máy mới trong 30 phút.",
    pill: "Trade-in",
  },
  {
    title: "Bảo hành 1 đổi 1",
    subtitle: "Xử lý 24h cho lỗi NSX, hỗ trợ tại 80+ điểm nhận.",
    pill: "Care+",
  },
];

const sortProducts = (products, option) => {
  const list = [...products];
  const getPrice = (product) => product.finalPrice ?? product.price ?? 0;

  switch (option) {
    case "price-asc":
      return list.sort((a, b) => getPrice(a) - getPrice(b));
    case "price-desc":
      return list.sort((a, b) => getPrice(b) - getPrice(a));
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return list.sort(
        (a, b) =>
          (b.ratingCount ?? 0) - (a.ratingCount ?? 0) ||
          (b.rating ?? 0) - (a.rating ?? 0)
      );
  }
};

const matchesSearchKeyword = (product, keyword) => {
  if (!keyword) return true;
  const fields = [
    product?.name,
    product?.slug,
    product?.brand,
    product?.shortDescription,
    product?.warrantyPolicy,
    Array.isArray(product?.tags) ? product.tags.join(" ") : "",
  ];
  return fields.some((field) => normalizeText(field).includes(keyword));
};

const buildPageRange = (current = 1, total = 1, maxLength = 5) => {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.min(Math.max(1, current), safeTotal);
  const length = Math.max(1, maxLength);

  if (safeTotal <= length) {
    return Array.from({ length: safeTotal }, (_, index) => index + 1);
  }

  const half = Math.floor(length / 2);
  let start = safeCurrent - half;
  let end = safeCurrent + half;
  if (length % 2 === 0) {
    end -= 1;
  }

  if (start < 1) {
    end += 1 - start;
    start = 1;
  }

  if (end > safeTotal) {
    start -= end - safeTotal;
    end = safeTotal;
  }

  start = Math.max(1, start);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const FALLBACK_BANNER = {
  title: "Khám phá flagship mới nhất",
  subtitle: HERO_SUBTITLE,
  imageUrl: HERO_FALLBACK,
  link: "",
  ctaLabel: "Xem sản phẩm",
};

const normalizeBanner = (raw, index = 0) => {
  if (!raw || typeof raw !== "object") {
    return { id: `fallback-${index}`, ...FALLBACK_BANNER };
  }

  const safeRecordRaw = Array.isArray(raw?.data) ? raw.data[0] : raw;
  const safeRecord =
    safeRecordRaw && typeof safeRecordRaw === "object"
      ? safeRecordRaw
      : { description: safeRecordRaw };

  return {
    id: safeRecord?._id || `banner-${index}`,
    title: safeRecord?.title || safeRecord?.sentence || FALLBACK_BANNER.title,
    subtitle:
      safeRecord?.description || safeRecord?.subtitle || FALLBACK_BANNER.subtitle,
    imageUrl: safeRecord?.imageUrl || safeRecord?.image || FALLBACK_BANNER.imageUrl,
    link: safeRecord?.link || FALLBACK_BANNER.link,
    ctaLabel: safeRecord?.ctaLabel || FALLBACK_BANNER.ctaLabel,
  };
};

const PublicHome = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, status, filters: storeFilters, pagination } = useSelector(
    (state) => state.products
  );

  const [bannerSlides, setBannerSlides] = useState([normalizeBanner(null)]);
  const [searchInput, setSearchInput] = useState(storeFilters.search || "");
  const [sortOption, setSortOption] = useState("popular");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState(APPLE_FULL_CATALOG);
  const currentPage = storeFilters.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const displayPage = Math.min(currentPage, totalPages);
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const pageButtons = useMemo(
    () => buildPageRange(displayPage, totalPages, 5),
    [displayPage, totalPages]
  );

  useEffect(() => {
    dispatch(fetchProducts(storeFilters));
  }, [dispatch, storeFilters]);

  useEffect(() => {
    setSearchInput(storeFilters.search || "");
  }, [storeFilters.search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch(setFilters({ search: searchInput.trim() }));
    }, 200);
    return () => clearTimeout(handler);
  }, [dispatch, searchInput]);

  useEffect(() => {
    let active = true;

    const loadBanner = async () => {
      try {
        const response = await apiClient.get("/banners");
        const data = response.data;
        if (!active) return;

        const banners = Array.isArray(data?.data) ? data.data : [];
        const nextSlides = banners
          .slice(0, 3)
          .map((item, idx) => normalizeBanner(item, idx));

        if (nextSlides.length) {
          setBannerSlides(nextSlides);
        } else {
          const fallbackSource = data?.featured || data;
          setBannerSlides([normalizeBanner(fallbackSource, 0)]);
        }
      } catch (error) {
        if (active) {
          setBannerSlides([normalizeBanner(null)]);
        }
      }
    };

    loadBanner();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      try {
        const res = await fetchPublicCategories();
        if (active && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const dynamic = [
            { id: "", label: "Tất cả sản phẩm", icon: "🍎", subCategories: [] },
            ...res.data.data.map((c) => ({
              id: c.name,
              label: c.name,
              icon: c.icon || "🍎",
              subCategories: c.subCategories || [],
            })),
          ];
          setCategoriesList(dynamic);
        }
      } catch {
        // keep fallback
      }
    };
    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    dispatch(setFilters({ search: searchInput.trim() }));
  };

  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };

  const handlePageChange = (pageNumber) => {
    const targetPage = Math.max(1, Math.min(totalPages, pageNumber));
    if (targetPage === currentPage) {
      return;
    }
    dispatch(setFilters({ page: targetPage }));
    document
      .getElementById("product-grid")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeCatalogItem = useMemo(() => {
    return (
      categoriesList.find(
        (cat) => cat.id.toLowerCase() === (storeFilters.category || "").toLowerCase()
      ) || categoriesList[0] || APPLE_FULL_CATALOG[0]
    );
  }, [categoriesList, storeFilters.category]);

  const filteredProducts = useMemo(() => {
    const keyword = normalizeText(storeFilters.search || "");
    const categoryFilter = (storeFilters.category || "").toLowerCase();
    const subCatFilter = (selectedSubCategory || "").toLowerCase();
    return items.filter((product) => {
      const matchesCategory =
        !categoryFilter ||
        (product.category || "").toLowerCase().includes(categoryFilter);
      const matchesSubCategory =
        !subCatFilter ||
        (product.subCategory || "").toLowerCase().includes(subCatFilter);
      const matchesKeyword = matchesSearchKeyword(product, keyword);
      return matchesCategory && matchesSubCategory && matchesKeyword;
    });
  }, [items, storeFilters.category, selectedSubCategory, storeFilters.search]);

  const sortedProducts = useMemo(
    () => sortProducts(filteredProducts, sortOption),
    [filteredProducts, sortOption]
  );

  const [spotlightConfig, setSpotlightConfig] = useState(null);

  useEffect(() => {
    apiClient
      .get("/spotlight")
      .then((res) => {
        if (res.data?.data) {
          setSpotlightConfig(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const gridProducts = useMemo(() => sortedProducts, [sortedProducts]);

  const isSpotlightActive = spotlightConfig ? spotlightConfig.isActive !== false : true;

  const targetFeaturedProduct = useMemo(() => {
    if (spotlightConfig?.product && typeof spotlightConfig.product === "object") {
      return spotlightConfig.product;
    }
    const fromGrid = gridProducts.find((p) => p.featured) || gridProducts[0] || null;
    return fromGrid;
  }, [spotlightConfig, gridProducts]);

  const targetFeaturedImage = useMemo(() => {
    if (spotlightConfig?.customImage) {
      return getAssetUrl(spotlightConfig.customImage);
    }
    return targetFeaturedProduct
      ? getProductImage(
          targetFeaturedProduct,
          "https://placehold.co/600x400?text=Featured+Product"
        )
      : null;
  }, [spotlightConfig, targetFeaturedProduct]);

  const targetFeaturedPrices = useMemo(() => {
    if (spotlightConfig?.customPrice) {
      return {
        finalPrice: spotlightConfig.customPrice,
        originalPrice: spotlightConfig.customOldPrice || null,
      };
    }
    return resolveProductPrices(targetFeaturedProduct);
  }, [spotlightConfig, targetFeaturedProduct]);

  const targetFeaturedBadge = spotlightConfig?.badge || "Sản phẩm nổi bật";
  const targetFeaturedTitle = spotlightConfig?.title || targetFeaturedProduct?.name || "";
  const targetFeaturedDesc =
    spotlightConfig?.description ||
    targetFeaturedProduct?.shortDescription ||
    "Sở hữu ngay flagship mới nhất với ưu đãi đặc quyền và bảo hành chu đáo tại Ngọc Triết Store.";

  const isLoading = status === "loading";
  const gridIsLoading = isLoading;
  const showPagination = totalPages > 1;

  return (
    <>
      <div className="relative pb-20 sm:pb-28">
        <div className="absolute inset-0 -z-10 bg-white/30" aria-hidden="true" />
        <div className="container-safe space-y-12 py-10">
          <Banner
            slides={bannerSlides}
            onSlideNavigate={(slide) => {
              if (slide?.link) {
                if (/^https?:\/\//i.test(slide.link)) {
                  window.location.href = slide.link; // stay in same tab
                } else {
                  navigate(slide.link);
                }
                return;
              }
              const element = document.getElementById("product-grid");
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
              }
            }}
          />

        <section className="grid gap-4 md:grid-cols-3">
          {EXPERIENCE_FEATURES.map((feature, featureIndex) => (
            <div
              key={feature.title}
              className={`motion-card motion-delay-${(featureIndex % 4) + 1} rounded-3xl border border-white/60 bg-white/90 p-6 shadow-card backdrop-blur motion-hover-float`}
            >
              <h3 className="text-xl font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500">{feature.subtitle}</p>
            </div>
          ))}
        </section>

        <section className="motion-panel rounded-[32px] border border-white/60 bg-white/90 p-6 shadow-glass backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full flex-1 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm transition focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20"
            >
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm kiếm iPhone 16 Pro, MacBook, iPad, Apple Watch, AirPods..."
                className="w-full border-none text-sm text-slate-700 outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow-halo transition hover:-translate-y-0.5 hover:bg-brand-dark"
              >
                Tìm kiếm
              </button>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="text-sm font-medium text-slate-600">
                Sắp xếp theo
              </label>
              <select
                value={sortOption}
                onChange={handleSortChange}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="popular">Phổ biến</option>
                <option value="price-asc">Giá: Thấp đến cao</option>
                <option value="price-desc">Giá: Cao đến thấp</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {categoriesList.map((cat, idx) => {
              const isActive = (storeFilters.category || "").toLowerCase() === cat.id.toLowerCase();
              return (
                <button
                  key={cat.id || "all"}
                  type="button"
                  onClick={() => {
                    dispatch(setFilters({ category: cat.id, page: 1 }));
                    setSelectedSubCategory("");
                  }}
                  className={`motion-chip motion-delay-${(idx % 6) + 1} flex items-center gap-2 rounded-full border px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition duration-200 hover:-translate-y-0.5 ${
                    isActive
                      ? "border-transparent bg-slate-950 text-white shadow-lg"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900"
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {activeCatalogItem?.subCategories?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">
                Phân loại {activeCatalogItem.label}:
              </span>
              <button
                type="button"
                onClick={() => setSelectedSubCategory("")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition duration-200 ${
                  !selectedSubCategory
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Tất cả {activeCatalogItem.label}
              </button>
              {activeCatalogItem.subCategories.map((sub) => {
                const isSubActive = selectedSubCategory === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubCategory(isSubActive ? "" : sub)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition duration-200 ${
                      isSubActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {isSpotlightActive && targetFeaturedProduct && (
          <section className="motion-panel grid gap-6">
            <div className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
              <div className="absolute inset-0 opacity-25">
                <img
                  src={targetFeaturedImage}
                  alt={targetFeaturedTitle}
                  className="h-full w-full object-cover mix-blend-overlay"
                  loading="lazy"
                />
              </div>
              <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                <div className="space-y-4 max-w-xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                    {targetFeaturedBadge}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white tracking-tight">
                    {targetFeaturedTitle}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {targetFeaturedDesc}
                  </p>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-blue-400">
                      {formatCurrency(targetFeaturedPrices.finalPrice)}
                    </span>
                    {targetFeaturedPrices.originalPrice && targetFeaturedPrices.originalPrice > targetFeaturedPrices.finalPrice ? (
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(targetFeaturedPrices.originalPrice)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (spotlightConfig?.link) {
                          if (/^https?:\/\//i.test(spotlightConfig.link)) {
                            window.location.href = spotlightConfig.link;
                          } else {
                            navigate(spotlightConfig.link);
                          }
                        } else if (targetFeaturedProduct?.slug) {
                          navigate(`/product/${targetFeaturedProduct.slug}`);
                        } else {
                          navigate("/products");
                        }
                      }}
                      className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
                    >
                      Xem chi tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/products")}
                      className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                    >
                      Khám phá thêm
                    </button>
                  </div>
                </div>
                {targetFeaturedImage ? (
                  <div className="relative mt-6 flex w-full items-center justify-center lg:mt-0 lg:w-auto">
                    <div className="relative p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
                      <img
                        src={targetFeaturedImage}
                        alt={targetFeaturedTitle}
                        className="h-56 w-56 sm:h-64 sm:w-64 object-contain drop-shadow-2xl transition duration-500 hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )}


        <section id="product-grid">
          <div className="motion-panel flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {storeFilters.category ? storeFilters.category : "Tất cả sản phẩm Apple"}
              </h2>
              {selectedSubCategory && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-200">
                  › {selectedSubCategory}
                </span>
              )}
              {(storeFilters.category || selectedSubCategory || storeFilters.search) && (
                <button
                  type="button"
                  onClick={() => {
                    dispatch(setFilters({ category: "", search: "", page: 1 }));
                    setSelectedSubCategory("");
                  }}
                  className="text-xs font-medium text-rose-500 hover:text-rose-700 hover:underline ml-2"
                >
                  [Xóa bộ lọc]
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Hiển thị {gridProducts.length} sản phẩm
              </span>
              <Link
                to="/products"
                className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                Xem toàn bộ kho hàng →
              </Link>
            </div>
          </div>

          {gridIsLoading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : gridProducts.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {gridProducts.map((product, productIndex) => (
                <div
                  key={product._id || product.slug || productIndex}
                  className={`motion-card motion-delay-${(productIndex % 6) + 1}`}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                Không thấy sản phẩm nào phù hợp
              </h3>
              <p className="mt-3 text-sm text-slate-500">
                Hãy thử đổi từ khóa hoặc chọn thương hiệu khác để xem thêm kết quả.
              </p>
            </div>
          )}
          {showPagination ? (
            <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevPage || gridIsLoading}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  !hasPrevPage || gridIsLoading
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary hover:text-brand-primary"
                }`}
              >
                Trang trước
              </button>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                <span className="text-sm font-medium text-slate-500">
                  Trang {displayPage}/{totalPages}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {pageButtons.map((pageNumber) => (
                    <button
                      type="button"
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={gridIsLoading && pageNumber === currentPage}
                      className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                        pageNumber === displayPage
                          ? "border-brand-primary bg-brand-primary text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary hover:text-brand-primary"
                      } ${gridIsLoading && pageNumber === currentPage ? "cursor-wait opacity-70" : ""}`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage || gridIsLoading}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  !hasNextPage || gridIsLoading
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary hover:text-brand-primary"
                }`}
              >
                Trang sau
              </button>
            </div>
          ) : null}
        </section>
        </div>
      </div>
    </>
  );
};

export default PublicHome;
