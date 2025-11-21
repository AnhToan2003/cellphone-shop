import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import Banner from "../components/Banner.jsx";
import ProductCard from "../components/ProductCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { fetchProducts, setFilters } from "../store/slices/productSlice.js";
import { normalizeText } from "../utils/text.js";
import { getProductImage } from "../utils/assets.js";
import { fetchBrands, fetchHomeCategories } from "../services/api.js";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80";
const HERO_SUBTITLE =
  "Ưu đãi độc quyền, giao nhanh toàn quốc và nhiều chương trình trả góp linh hoạt cho từng flagship mới nhất.";

const FALLBACK_BRANDS = ["Apple", "Samsung", "Xiaomi", "OPPO", "Honor", "Vivo"].map(
  (name, index) => ({
    name,
    slug: name.toLowerCase(),
    order: index,
  })
);

const PRODUCT_CATEGORIES = [
  {
    title: "Luxury Flagship",
    subtitle: "iPhone 15 Pro, Galaxy Z v� Find X series",
    gradient: "from-fuchsia-500 via-rose-500 to-amber-400",
  },
  {
    title: "Gaming Beast",
    subtitle: "Snapdragon 8, màn 144Hz, tản nhiệt chủ động",
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
  },
  {
    title: "Camera Pro",
    subtitle: "Ống kính Leica, zoom tiệm cận DSLR",
    gradient: "from-emerald-500 via-lime-500 to-amber-300",
  },
  {
    title: "Pin trâu 3 ngày",
    subtitle: "6000mAh + sạc nhanh 120W",
    gradient: "from-purple-600 via-slate-700 to-black",
  },
  {
    title: "Selfie & Vlog",
    subtitle: "Oppo Find N3, Vivo V series, bộ kit dành cho Gen Z",
    gradient: "from-pink-500 via-orange-400 to-yellow-300",
  },
  {
    title: "Giá mềm",
    subtitle: "Honor X, Redmi series dưới 8 triệu",
    gradient: "from-slate-900 via-slate-700 to-slate-500",
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

const slugify = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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
  const [homeCategories, setHomeCategories] = useState(PRODUCT_CATEGORIES);
  const [brandOptions, setBrandOptions] = useState(FALLBACK_BRANDS);
  const [activeStyleId, setActiveStyleId] = useState(null);
  const [styleFilterEnabled, setStyleFilterEnabled] = useState(false);
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
        const response = await fetch("/api/banners");
        if (!response.ok) {
          throw new Error("Không thể tải banner");
        }
        const data = await response.json();
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
        const response = await fetchHomeCategories();
        const payload = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        if (!active || !payload.length) return;
        setHomeCategories(payload);
      } catch {
        // fallback to defaults
      }
    };
    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadBrands = async () => {
      try {
        const response = await fetchBrands();
        const payload = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        if (!active || !payload.length) return;
        setBrandOptions(
          payload.map((brand) => ({
            name: brand.name || "",
            slug: brand.slug || "",
            logoUrl: brand.logoUrl || "",
            order: brand.order ?? 0,
          }))
        );
      } catch {
        // fallback to defaults
      }
    };
    loadBrands();
    return () => {
      active = false;
    };
  }, []);

  const productLookup = useMemo(() => {
    const map = new Map();
    items.forEach((product) => {
      if (product?.slug) {
        map.set(product.slug, product);
      }
    });
    return map;
  }, [items]);

  const activeStyle = useMemo(() => {
    if (!activeStyleId) return null;
    return (
      homeCategories.find(
        (category) => (category._id || category.title) === activeStyleId
      ) || null
    );
  }, [activeStyleId, homeCategories]);

  const activeStyleProducts = useMemo(() => {
    if (!activeStyle) return [];
    if (
      Array.isArray(activeStyle.linkedProducts) &&
      activeStyle.linkedProducts.length
    ) {
      return activeStyle.linkedProducts;
    }
    const slugCandidates = Array.isArray(activeStyle.productSlugs)
      ? activeStyle.productSlugs
      : activeStyle.productSlug
      ? [activeStyle.productSlug]
      : [];
    if (!slugCandidates.length) {
      return [];
    }
    return slugCandidates
      .map((slug) => productLookup.get(slug))
      .filter(Boolean);
  }, [activeStyle, productLookup]);

  const scrollToStyleSection = () => {
    const target = document.getElementById("shopping-style-products");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const buildCategoryPath = (category) => {
    if (!category) return "";
    const identifier = category._id || slugify(category.title || "");
    return identifier ? `/category/${identifier}` : "";
  };

  const handleOpenCategoryPage = (category) => {
    const path = buildCategoryPath(category);
    if (!path) return;
    navigate(path);
  };

  const handleShoppingStyleSelect = (category) => {
    if (!category) return;
    const identifier = category._id || category.title;
    setActiveStyleId(identifier);

    const hasAssignedProducts =
      (Array.isArray(category.linkedProducts) &&
        category.linkedProducts.length > 0) ||
      (Array.isArray(category.productSlugs) &&
        category.productSlugs.length > 0) ||
      Boolean(category.productSlug);

    if (hasAssignedProducts) {
      setStyleFilterEnabled(true);
      scrollToStyleSection();
      return;
    }

    setStyleFilterEnabled(false);
    const keyword = category.searchKeyword || category.title;
    if (keyword) {
      dispatch(setFilters({ search: keyword }));
      document
        .getElementById("product-grid")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    dispatch(setFilters({ search: searchInput.trim() }));
  };

  const handleBrandClick = (brand) => {
    const filterKey = brand?.filterKey || "";
    if (!filterKey) {
      return;
    }
    const nextBrand = storeFilters.brand === filterKey ? "" : filterKey;
    dispatch(setFilters({ brand: nextBrand }));
  };

  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };

  const handleClearStyleFilter = () => {
    setStyleFilterEnabled(false);
    setActiveStyleId(null);
    document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" });
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

  const filteredProducts = useMemo(() => {
    const keyword = normalizeText(storeFilters.search || "");
    const brandFilter = storeFilters.brand?.toLowerCase() || "";
    return items.filter((product) => {
      const matchesBrand =
        !brandFilter || slugify(product.brand || "") === brandFilter;
      const matchesKeyword = matchesSearchKeyword(product, keyword);
      return matchesBrand && matchesKeyword;
    });
  }, [items, storeFilters.brand, storeFilters.search]);

  const sortedProducts = useMemo(
    () => sortProducts(filteredProducts, sortOption),
    [filteredProducts, sortOption]
  );

  const gridProducts = useMemo(
    () =>
      styleFilterEnabled && activeStyleProducts.length
        ? activeStyleProducts
        : sortedProducts,
    [styleFilterEnabled, activeStyleProducts, sortedProducts]
  );

  const featuredProduct = gridProducts[0] || null;
  const featuredImage = featuredProduct
    ? getProductImage(
        featuredProduct,
        "https://placehold.co/600x400?text=Featured+Product"
      )
    : null;
  const featuredPrices = useMemo(
    () => resolveProductPrices(featuredProduct),
    [featuredProduct]
  );

  const isLoading = status === "loading";
  const gridIsLoading = !styleFilterEnabled && isLoading;
  const showPagination = !styleFilterEnabled && totalPages > 1;

  const brandList = useMemo(() => {
    const sourceBrands = brandOptions.length ? brandOptions : FALLBACK_BRANDS;
    return sourceBrands
      .map((brand, index) => {
        const label = (brand.name || brand.slug || "").trim();
        if (!label) {
          return null;
        }
        const filterKey = (brand.slug || slugify(label)).toLowerCase();
        return {
          id: brand._id || filterKey,
          name: label,
          slug: brand.slug || slugify(label),
          logoUrl: brand.logoUrl || "",
          order: brand.order ?? index,
          filterKey,
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)
      );
  }, [brandOptions]);

  const activeBrand = (storeFilters.brand || "").toLowerCase();

  return (
    <>
      <div className="relative pb-24">
        <div className="absolute inset-0 -z-10 bg-white/30" aria-hidden="true" />
        <div className="container-safe space-y-12 py-10">
        <Banner
          slides={bannerSlides}
          onSlideNavigate={(slide) => {
            if (slide?.link) {
              if (/^https?:\/\//i.test(slide.link)) {
                window.open(slide.link, "_blank", "noopener,noreferrer");
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
              <span className="pill-badge bg-white/70 text-slate-500">{feature.pill}</span>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">
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
                placeholder="Tìm iPhone 15 Pro Max, Samsung S24 Ultra..."
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

          <div className="mt-6 flex flex-wrap gap-3">
            {brandList.map((brand, brandIndex) => {
              const label = brand?.name || brand?.slug || "";
              if (!label) return null;
              const isActive = activeBrand === brand.filterKey;
              return (
                <button
                  key={brand.id || brand.slug || brand.name || brandIndex}
                  type="button"
                  onClick={() => handleBrandClick(brand)}
                  className={`motion-chip motion-delay-${(brandIndex % 6) + 1} flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 ${
                    isActive
                      ? "border-transparent bg-brand-primary text-white shadow-halo"
                      : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary hover:text-brand-primary"
                  }`}
                >
                  {brand.logoUrl ? (
                    <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-white/40">
                      <img
                        src={brand.logoUrl}
                        alt={label}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </span>
                  ) : null}
                  {label}
                </button>
              );
            })}
            {storeFilters.brand && (
              <button
                type="button"
                onClick={() => dispatch(setFilters({ brand: "" }))}
                className="motion-chip rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500 transition duration-200 hover:-translate-y-0.5 hover:border-brand-primary hover:text-brand-primary"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </section>

        {featuredProduct && (
          <section className="motion-panel grid gap-6">
            <div className="relative overflow-hidden rounded-[30px] border border-white/50 bg-gradient-to-br from-brand-primary via-rose-500 to-brand-dark p-6 text-white shadow-glass">
              <div className="absolute inset-0 opacity-40">
                <img
                  src={featuredImage}
                  alt={featuredProduct.name}
                  className="h-full w-full object-cover mix-blend-overlay"
                  loading="lazy"
                />
              </div>
              <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row">
                <div className="space-y-4">
                  <span className="pill-badge bg-white/10 text-white">
                    Hot pick
                  </span>
                  <h3 className="text-3xl font-semibold leading-tight">
                    {featuredProduct.name}
                  </h3>
                  <p className="text-sm text-white/80">
                    {featuredProduct.shortDescription ||
                      "Sở hữu ngay flagship mới nhất với ưu đãi đặc quyền và giao trong 2 giờ."}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-bold">
                      {formatCurrency(featuredPrices.finalPrice)}
                    </span>
                    {featuredPrices.originalPrice ? (
                      <span className="text-sm text-white/60 line-through">
                        {formatCurrency(featuredPrices.originalPrice)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/product/${featuredProduct.slug}`)}
                      className="banner-cta inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-light hover:text-white"
                    >
                      Xem chi tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/checkout")}
                      className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white/90 transition hover:-translate-y-0.5 hover:bg-white/10"
                    >
                      Mua ngay
                    </button>
                  </div>
                </div>
                {featuredImage ? (
                  <div className="relative mt-6 flex w-full items-center justify-center lg:mt-0">
                    <div className="motion-hover-float relative">
                      <span className="absolute inset-0 -z-10 rounded-[32px] bg-white/20 blur-3xl" />
                      <img
                        src={featuredImage}
                        alt={featuredProduct.name}
                        className="h-64 w-64 object-contain drop-shadow-2xl"
                        loading="lazy"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )}

        <section className="motion-panel mt-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
                Danh mục đề xuất
              </p>
              <h2 className="text-3xl font-semibold text-slate-900">
                Chọn phong cách của bạn
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Cá nhân hóa theo nhu cầu: camera, gaming, flagship hay giá tốt.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(homeCategories.length ? homeCategories : PRODUCT_CATEGORIES).map(
              (category, categoryIndex) => {
                const styleId = category._id || category.title;
                const isActiveStyle = styleFilterEnabled && activeStyleId === styleId;
                const categoryProducts = Array.isArray(
                  category.linkedProducts
                )
                  ? category.linkedProducts.slice(0, 3)
                  : [];

                return (
                  <div
                    key={category._id || category.title}
                    className={`motion-card motion-delay-${
                      (categoryIndex % 6) + 1
                    } rounded-3xl border ${
                      isActiveStyle
                        ? "border-white shadow-glass"
                        : "border-white/40"
                    } bg-gradient-to-br ${category.gradient} p-5 text-white shadow-lg motion-hover-float`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.4em] text-white/70">
                        #{categoryIndex + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenCategoryPage(category)}
                        className="rounded-full border border-white/40 px-4 py-1 text-xs font-semibold text-white/80 transition hover:-translate-y-0.5 hover:bg-white/10"
                      >
                        Xem danh mục
                      </button>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold">{category.title}</h3>
                    <p className="mt-2 text-sm text-white/90">{category.subtitle}</p>
                    {categoryProducts.length ? (
                      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                        {categoryProducts.map((product) => {
                          const productKey = product._id || product.slug;
                          const imageSrc = getProductImage(
                            product,
                            "https://placehold.co/80x80?text=No+Img"
                          );
                          const priceInfo = resolveProductPrices(product);
                          const finalPriceLabel = formatCurrency(
                            priceInfo.finalPrice
                          );
                          const originalPriceLabel = priceInfo.originalPrice
                            ? formatCurrency(priceInfo.originalPrice)
                            : null;
                          return (
                            <button
                              type="button"
                              key={productKey}
                              onClick={() => navigate(`/product/${product.slug}`)}
                              className="group flex min-w-[170px] flex-1 items-center gap-3 rounded-2xl border border-white/25 bg-white/10 px-3 py-2 text-left text-white/90 transition hover:-translate-y-0.5 hover:bg-white/20"
                            >
                              <div className="h-12 w-12 overflow-hidden rounded-xl bg-white/20">
                                <img
                                  src={imageSrc}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold leading-tight line-clamp-2">
                                  {product.name}
                                </p>
                                <p className="text-[11px] text-white/70">
                                  {finalPriceLabel}
                                  {originalPriceLabel ? (
                                    <span className="ml-2 text-white/60 line-through">
                                      {originalPriceLabel}
                                    </span>
                                  ) : null}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              }
            )}
          </div>
        </section>

        <section id="shopping-style-products" className="motion-panel mt-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>

            </div>
            <div className="flex flex-wrap gap-2">
              {homeCategories.map((category) => {
                const identifier = category._id || category.title;
                const isActive = identifier === activeStyleId;
                return (
                  <button
                    key={identifier}
                    type="button"
                    onClick={() => handleShoppingStyleSelect(category)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${
                      isActive
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                        : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary hover:text-brand-primary"
                    }`}
                  >
                    {category.title}
                  </button>
                );
              })}
              {styleFilterEnabled ? (
                <button
                  type="button"
                  onClick={handleClearStyleFilter}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-brand-primary hover:text-brand-primary"
                >
                  Xem tất cả
                </button>
              ) : null}
            </div>
          </div>

          {styleFilterEnabled ? (
            activeStyleProducts.length ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {activeStyleProducts.map((product, productIndex) => (
                  <div
                    key={product._id || product.slug}
                    className={`motion-card motion-delay-${(productIndex % 6) + 1}`}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Chưa có sản phẩm nào được gắn kèm cho phong cách này. Vui lòng thêm sản phẩm trong trang quản trị hoặc chọn phong cách khác.
              </div>
            )
          ) : null}
        </section>
        <section id="product-grid">
          <div className="motion-panel flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Sản phẩm nổi bật
              </h2>
              {styleFilterEnabled && activeStyle?.title ? (
                <p className="text-xs font-semibold text-brand-primary">
                  Đang hiển thị danh mục: {activeStyle.title}
                </p>
              ) : null}
            </div>
            <span className="text-sm text-slate-500">
              Hiển thị {gridProducts.length} sản phẩm
            </span>
          </div>

          {gridIsLoading ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : gridProducts.length ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
