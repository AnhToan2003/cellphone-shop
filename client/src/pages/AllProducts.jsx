import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../components/ProductCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import BackButton from "../components/BackButton.jsx";
import { fetchPublicProducts, fetchPublicCategories } from "../services/api.js";

const PAGE_SIZE = 24;

const APPLE_CATEGORIES = [
  { id: "", label: "Tất cả sản phẩm" },
  {
    id: "iPhone",
    label: "iPhone",
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
    subCategories: [
      "iPad Pro",
      "iPad Air",
      "iPad Gen 10 / Gen 9",
      "iPad Mini",
    ],
  },
  {
    id: "Mac",
    label: "Mac & MacBook",
    subCategories: [
      "MacBook Pro",
      "MacBook Air",
      "iMac",
      "Mac mini & Mac Studio",
    ],
  },
  {
    id: "Apple Watch",
    label: "Apple Watch",
    subCategories: [
      "Apple Watch Ultra",
      "Apple Watch Series",
      "Apple Watch SE",
    ],
  },
  {
    id: "Phụ kiện",
    label: "Phụ kiện & AirPods",
    subCategories: [
      "Tai nghe & AirPods",
      "Củ sạc & Cáp sạc",
      "Ốp lưng & Bao da",
      "Apple Pencil & Bàn phím",
    ],
  },
];

const AllProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSubCategory = searchParams.get("subCategory") || "";
  const initialPage = Number(searchParams.get("page")) || 1;

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [subCategory, setSubCategory] = useState(initialSubCategory);
  const [page, setPage] = useState(initialPage);
  const [sort, setSort] = useState(searchParams.get("sort") || "");
  const [categoriesList, setCategoriesList] = useState(APPLE_CATEGORIES);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      try {
        const res = await fetchPublicCategories();
        if (active && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const dynamic = [
            { id: "", label: "Tất cả sản phẩm" },
            ...res.data.data.map((c) => ({
              id: c.name,
              label: c.name,
              subCategories: c.subCategories || [],
            })),
          ];
          setCategoriesList(dynamic);
        }
      } catch {
        // fallback
      }
    };
    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  // Sync state if URL changes from external navigation (e.g. Header nav)
  useEffect(() => {
    const urlCategory = searchParams.get("category") || "";
    const urlSubCategory = searchParams.get("subCategory") || "";
    const urlSearch = searchParams.get("search") || "";
    const urlSort = searchParams.get("sort") || "";
    const urlPage = Number(searchParams.get("page")) || 1;

    setCategory((prev) => (prev !== urlCategory ? urlCategory : prev));
    setSubCategory((prev) => (prev !== urlSubCategory ? urlSubCategory : prev));
    setSearch((prev) => (prev !== urlSearch ? urlSearch : prev));
    setSort((prev) => (prev !== urlSort ? urlSort : prev));
    setPage((prev) => (prev !== urlPage ? urlPage : prev));
  }, [searchParams]);

  useEffect(() => {
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      if (search) {
        next.set("search", search);
      } else {
        next.delete("search");
      }
      if (category) {
        next.set("category", category);
      } else {
        next.delete("category");
      }
      if (subCategory) {
        next.set("subCategory", subCategory);
      } else {
        next.delete("subCategory");
      }
      if (sort) {
        next.set("sort", sort);
      } else {
        next.delete("sort");
      }
      next.set("page", String(page));
      return next;
    });
  }, [search, category, subCategory, sort, page, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchPublicProducts({
          search: search || undefined,
          category: category || undefined,
          subCategory: subCategory || undefined,
          page,
          limit: PAGE_SIZE,
          sort: sort || undefined,
        });
        if (cancelled) return;
        const items = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        setProducts(items);
        const metaPayload = response.data?.pagination || response.data?.meta || {};
        const totalItems = metaPayload.totalItems ?? metaPayload.total ?? items.length;
        setMeta({
          total: totalItems,
          totalPages:
            metaPayload.totalPages ??
            Math.max(1, Math.ceil(totalItems / PAGE_SIZE)),
        });
      } catch (err) {
        if (cancelled) return;
        setError(
          err?.response?.data?.message ||
            "Không thể tải danh sách sản phẩm. Vui lòng thử lại."
        );
        setProducts([]);
        setMeta({ total: 0, totalPages: 1 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [page, search, category, subCategory, sort]);

  const activeCategoryObj = useMemo(() => {
    return (
      categoriesList.find(
        (cat) => cat.id.toLowerCase() === category.toLowerCase()
      ) || null
    );
  }, [categoriesList, category]);

  const pageInfo = useMemo(() => {
    const current = Math.min(Math.max(1, page), meta.totalPages || 1);
    return {
      current,
      totalPages: meta.totalPages || 1,
    };
  }, [meta.totalPages, page]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setPage(1);
  };

  const handleSortChange = (event) => {
    setSort(event.target.value);
    setPage(1);
  };

  const handleCategorySelect = (newCategory) => {
    setCategory(newCategory);
    setSubCategory("");
    setPage(1);
  };

  const handleSubCategorySelect = (newSub) => {
    setSubCategory((prev) => (prev === newSub ? "" : newSub));
    setPage(1);
  };

  const goToPage = (target) => {
    const safePage = Math.max(1, Math.min(meta.totalPages || 1, target));
    setPage(safePage);
  };

  return (
    <div className="bg-muted min-h-screen">
      <div className="container-safe space-y-6 py-8">
        <BackButton
          fallback="/"
          variant="neutral"
          iconSize={14}
          alwaysVisible
          wrapperClassName="mb-4"
          className="inline-flex border-slate-200 bg-white text-slate-700 shadow-sm"
        />

        {/* Hero Section */}
        <section className="rounded-[28px] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
          <p className="text-xs uppercase tracking-[0.4em] text-blue-400 font-bold">
            Ngọc Triết Store
          </p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {activeCategoryObj?.label
                  ? activeCategoryObj.label
                  : "Tất Cả Sản Phẩm Chính Hãng"}
              </h1>
              <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-300">
                Sản phẩm Apple chính hãng bảo hành 12 tháng, lỗi 1 đổi 1 trong 10 ngày. Giao hàng toàn quốc.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs sm:text-sm text-slate-200">
              Tổng số: <strong className="text-white">{meta.total || products.length}</strong> sản phẩm
            </div>
          </div>
        </section>

        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap">
          {categoriesList.map((cat) => {
            const isActive = category.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id || "all"}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`shrink-0 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 shadow-sm active:scale-95 ${
                  isActive
                    ? "bg-slate-950 text-white shadow-md scale-105"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* SubCategory Filter Pills (When a category with subcategories is selected) */}
        {activeCategoryObj?.subCategories?.length ? (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar rounded-2xl border border-slate-200 bg-white/70 p-2.5 sm:p-3 backdrop-blur-sm sm:flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-2 shrink-0">
              Dòng máy:
            </span>
            <button
              type="button"
              onClick={() => handleSubCategorySelect("")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                !subCategory
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả dòng {activeCategoryObj.label}
            </button>
            {activeCategoryObj.subCategories.map((sub) => {
              const isActiveSub = subCategory === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleSubCategorySelect(sub)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                    isActiveSub
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Search & Sort Bar */}
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <form
              onSubmit={handleSubmit}
              className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-sm transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20"
            >
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm iPhone 16 Pro Max, iPad Pro M4, MacBook Air M3..."
                className="w-full bg-transparent border-none text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow transition hover:bg-blue-600"
              >
                Tìm kiếm
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Sắp xếp:
              </label>
              <select
                value={sort}
                onChange={handleSortChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="">Mặc định</option>
                <option value="price-asc">Giá thấp → cao</option>
                <option value="price-desc">Giá cao → thấp</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>
          </div>

          {error && !loading ? (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-600">
              {error}
            </div>
          ) : null}

          {/* Product Grid */}
          <div className="mt-6">
            {loading ? (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="min-w-0">
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            ) : products.length ? (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product, index) => (
                  <div
                    key={product._id || product.slug || index}
                    className={`motion-card min-w-0 motion-delay-${(index % 6) + 1}`}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                <h3 className="text-base font-bold text-slate-800">
                  Không tìm thấy sản phẩm nào
                </h3>
                <p className="mt-2 text-xs text-slate-500">
                  Thử đổi bộ lọc, chọn danh mục khác hoặc nhập từ khóa tìm kiếm mới.
                </p>
                {(category || subCategory || search) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("");
                      setSubCategory("");
                      setSearch("");
                      setPage(1);
                    }}
                    className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-blue-500 shadow"
                  >
                    Xem tất cả sản phẩm
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pageInfo.totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
              <span className="text-xs text-slate-500 font-medium">
                Trang {pageInfo.current} / {pageInfo.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pageInfo.current <= 1 || loading}
                  onClick={() => goToPage(pageInfo.current - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Trang trước
                </button>
                {Array.from({ length: pageInfo.totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      disabled={loading}
                      onClick={() => goToPage(pNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
                        pNum === pageInfo.current
                          ? "bg-slate-900 text-white shadow-sm"
                          : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={pageInfo.current >= pageInfo.totalPages || loading}
                  onClick={() => goToPage(pageInfo.current + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AllProducts;
