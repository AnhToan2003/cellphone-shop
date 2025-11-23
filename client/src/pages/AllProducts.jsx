import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import ProductCard from "../components/ProductCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import BackButton from "../components/BackButton.jsx";
import { fetchPublicProducts } from "../services/api.js";

const PAGE_SIZE = 24;

const AllProducts = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get("search") || "";
  const initialPage = Number(searchParams.get("page")) || 1;

  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [sort, setSort] = useState(searchParams.get("sort") || "");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      if (search) {
        next.set("search", search);
      } else {
        next.delete("search");
      }
      if (sort) {
        next.set("sort", sort);
      } else {
        next.delete("sort");
      }
      next.set("page", String(page));
      return next;
    });
  }, [search, sort, page, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchPublicProducts({
          search: search || undefined,
          page,
          limit: PAGE_SIZE,
          sort: sort || undefined,
        });
        if (cancelled) return;
        const items = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        setProducts(items);
        const metaPayload = response.data?.meta || {};
        setMeta({
          total: metaPayload.total ?? items.length,
          totalPages:
            metaPayload.totalPages ??
            Math.max(1, Math.ceil((metaPayload.total || items.length) / PAGE_SIZE)),
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
  }, [page, search, sort]);

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
    // search already bound to input
  };

  const handleSortChange = (event) => {
    setSort(event.target.value);
    setPage(1);
  };

  const goToPage = (target) => {
    const safePage = Math.max(1, Math.min(meta.totalPages || 1, target));
    setPage(safePage);
  };

  return (
    <div className="bg-muted">
      <div className="container-safe space-y-8 py-10">
        <BackButton
          fallback="/"
          variant="neutral"
          iconSize={14}
          alwaysVisible
          wrapperClassName="mb-6"
          className="inline-flex border-slate-200 bg-white text-slate-700 shadow-sm"
        />

        <section className="rounded-[32px] border border-white/20 bg-gradient-to-r from-brand-primary via-rose-500 to-aurora p-8 text-white shadow-glass">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">
            Tất cả sản phẩm
          </p>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Khám phá toàn bộ danh mục</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/85">
                Lọc và sắp xếp nhanh. Lịch sử duyệt được lưu tại mục Đã xem trên thanh điều hướng.
              </p>
            </div>
            <div className="rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-sm text-white/90">
              Tổng: {meta.total || products.length} sản phẩm
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/60 bg-white/95 p-6 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <form
              onSubmit={handleSubmit}
              className="flex flex-1 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm transition focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20"
            >
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full border-none text-sm text-slate-700 outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow-halo transition hover:-translate-y-0.5 hover:bg-brand-dark"
              >
                Tìm kiếm
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm font-medium text-slate-600">
                Sắp xếp
              </label>
              <select
                value={sort}
                onChange={handleSortChange}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">Mặc định</option>
                <option value="price-asc">Giá thấp → cao</option>
                <option value="price-desc">Giá cao → thấp</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>
          </div>

          {error && !loading ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          <div className="mt-6">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonCard key={`skeleton-${index}`} />
                ))}
              </div>
            ) : products.length ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product, index) => (
                  <div
                    key={product._id || product.slug || index}
                    className={`motion-card motion-delay-${(index % 6) + 1}`}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                Không tìm thấy sản phẩm nào. Hãy thử từ khóa khác.
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => goToPage(pageInfo.current - 1)}
              disabled={loading || pageInfo.current <= 1}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                loading || pageInfo.current <= 1
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary hover:text-brand-primary"
              }`}
            >
              Trang trước
            </button>
            <span className="text-sm text-slate-600">
              Trang {pageInfo.current}/{pageInfo.totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(pageInfo.current + 1)}
              disabled={loading || pageInfo.current >= pageInfo.totalPages}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                loading || pageInfo.current >= pageInfo.totalPages
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary hover:text-brand-primary"
              }`}
            >
              Trang sau
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AllProducts;
