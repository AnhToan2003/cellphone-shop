import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import BackButton from "../components/BackButton.jsx";
import ProductCard from "../components/ProductCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import {
  fetchHomeCategories,
  fetchPublicProducts,
} from "../services/api.js";

const slugify = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const matchCategory = (categories, identifier) => {
  if (!Array.isArray(categories) || !categories.length) {
    return null;
  }
  if (!identifier) {
    return categories[0] || null;
  }
  const normalized = identifier.toString().trim().toLowerCase();
  return (
    categories.find((category) => {
      if (
        category._id &&
        category._id.toString().trim().toLowerCase() === normalized
      ) {
        return true;
      }
      const slugCandidate = slugify(category.slug || category.title || "");
      return slugCandidate === normalized;
    }) || null
  );
};

const ProductList = () => {
  const { categoryKey = "" } = useParams();
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [fallbackProducts, setFallbackProducts] = useState([]);
  const [productsStatus, setProductsStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setCategoriesLoading(true);
    setCategory(null);
    setFallbackProducts([]);
    setProductsStatus("idle");
    setError("");

    const loadCategories = async () => {
      try {
        const response = await fetchHomeCategories();
        if (!isMounted) return;
        const list = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        const matchedCategory = matchCategory(list, categoryKey);
        setCategory(matchedCategory);
        if (!matchedCategory) {
          setError("Danh mục này không tồn tại hoặc đã bị gỡ.");
        }
      } catch (err) {
        if (!isMounted) return;
        setError(
          err?.response?.data?.message ||
            "Không thể tải thông tin danh mục. Vui lòng thử lại."
        );
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, [categoryKey]);

  useEffect(() => {
    if (
      !category ||
      (Array.isArray(category.linkedProducts) &&
        category.linkedProducts.length)
    ) {
      setProductsStatus("idle");
      setFallbackProducts([]);
      return;
    }

    const keyword = category.searchKeyword || category.title;
    if (!keyword) {
      setProductsStatus("empty");
      setFallbackProducts([]);
      return;
    }

    let cancelled = false;
    const loadProducts = async () => {
      try {
        setProductsStatus("loading");
        const response = await fetchPublicProducts({
          search: keyword,
          limit: 24,
        });
        if (cancelled) return;
        const items = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        setFallbackProducts(items);
        setProductsStatus("succeeded");
      } catch (err) {
        if (cancelled) return;
        setProductsStatus("failed");
        setError(
          err?.response?.data?.message ||
            "Không thể tải danh sách sản phẩm cho danh mục này."
        );
      }
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [category]);

  const products = useMemo(() => {
    if (
      Array.isArray(category?.linkedProducts) &&
      category.linkedProducts.length
    ) {
      return category.linkedProducts;
    }

    if (
      Array.isArray(category?.productSlugs) &&
      category.productSlugs.length &&
      fallbackProducts.length
    ) {
      const lookup = new Map(
        fallbackProducts.map((product) => [product.slug, product])
      );
      return category.productSlugs
        .map((slug) => lookup.get(slug))
        .filter(Boolean);
    }

    return fallbackProducts;
  }, [category, fallbackProducts]);

  const heroGradient =
    category?.gradient || "from-slate-900 via-slate-700 to-slate-500";
  const isLoadingProducts = categoriesLoading || productsStatus === "loading";

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

        <section
          className={`rounded-[32px] border border-white/20 bg-gradient-to-br ${heroGradient} p-8 text-white shadow-glass`}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">
            {category ? "Danh mục đề xuất" : "Đang tải danh mục"}
          </p>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">
                {category?.title || "Đang tải..."}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                {category?.subtitle ||
                  "Chọn một danh mục cụ thể để xem các sản phẩm phù hợp."}
              </p>
            </div>
            {category?.searchKeyword ? (
              <div className="rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-sm text-white/90">
                Từ khóa gợi ý:{" "}
                <span className="font-semibold">
                  {category.searchKeyword}
                </span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/60 bg-white/95 p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
                Danh sách sản phẩm
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                {category?.title
                  ? `Sản phẩm thuộc ${category.title}`
                  : "Đang tải sản phẩm"}
              </h2>
              <p className="text-sm text-slate-500">
                {category?.subtitle ||
                  "Danh sách sẽ được cập nhật tự động theo từng danh mục."}
              </p>
            </div>
            <span className="rounded-full border border-slate-200 px-4 py-1 text-sm text-slate-600">
              {isLoadingProducts
                ? "Đang tải..."
                : `${products.length} sản phẩm`}
            </span>
          </div>

          {error && !isLoadingProducts ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          <div className="mt-6">
            {isLoadingProducts ? (
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
                    className="motion-card motion-delay-2"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                Hiện chưa có sản phẩm nào được gắn với danh mục này. Vui lòng
                quay lại sau hoặc chọn danh mục khác trên trang chủ.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductList;
