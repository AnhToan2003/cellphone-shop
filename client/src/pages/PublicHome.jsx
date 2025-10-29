import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import Banner from "../components/Banner.jsx";
import ProductCard from "../components/ProductCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { fetchProducts, setFilters } from "../store/slices/productSlice.js";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80";
const HERO_SUBTITLE =
  "Ưu đãi độc quyền, giao nhanh toàn quốc và nhiều chương trình trả góp linh hoạt cho mọi flagship mới nhất.";

const BRANDS = ["Apple", "Samsung", "Xiaomi", "OPPO", "Honor", "Vivo"];

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

  return {
    id: raw._id || `banner-${index}`,
    title: raw.title || raw.sentence || FALLBACK_BANNER.title,
    subtitle: raw.description || FALLBACK_BANNER.subtitle,
    imageUrl: raw.imageUrl || raw.image || FALLBACK_BANNER.imageUrl,
    link: raw.link || FALLBACK_BANNER.link,
    ctaLabel: raw.ctaLabel || FALLBACK_BANNER.ctaLabel,
  };
};

const PublicHome = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, status, filters: storeFilters } = useSelector(
    (state) => state.products
  );

  const [bannerSlides, setBannerSlides] = useState([normalizeBanner(null)]);
  const [searchInput, setSearchInput] = useState(storeFilters.search || "");
  const [sortOption, setSortOption] = useState("popular");

  useEffect(() => {
    dispatch(fetchProducts(storeFilters));
  }, [dispatch, storeFilters]);

  useEffect(() => {
    setSearchInput(storeFilters.search || "");
  }, [storeFilters.search]);

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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    dispatch(setFilters({ search: searchInput.trim() }));
  };

  const handleBrandClick = (brand) => {
    const nextBrand = storeFilters.brand === brand ? "" : brand;
    dispatch(setFilters({ brand: nextBrand }));
  };

  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };

  const sortedProducts = useMemo(
    () => sortProducts(items, sortOption),
    [items, sortOption]
  );

  const isLoading = status === "loading";

  return (
    <div className="bg-slate-50 pb-20">
      <div className="container-safe space-y-12 py-8">
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

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
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
                className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
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
            {BRANDS.map((brand) => {
              const isActive = storeFilters.brand === brand;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleBrandClick(brand)}
                  className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-transparent bg-brand-primary text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary hover:text-brand-primary"
                  }`}
                >
                  {brand}
                </button>
              );
            })}
            {storeFilters.brand && (
              <button
                type="button"
                onClick={() => dispatch(setFilters({ brand: "" }))}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:border-brand-primary hover:text-brand-primary"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </section>

        <section id="product-grid">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">
              Sản phẩm nổi bật
            </h2>
            <span className="text-sm text-slate-500">
              Hiển thị {sortedProducts.length} sản phẩm
            </span>
          </div>

          {isLoading ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : sortedProducts.length ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {sortedProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                Không tìm thấy sản phẩm phù hợp
              </h3>
              <p className="mt-3 text-sm text-slate-500">
                Hãy thử đổi từ khóa hoặc chọn thương hiệu khác để xem thêm kết quả.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PublicHome;
