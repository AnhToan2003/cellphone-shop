import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import {
  createAdminHomeCategory,
  deleteAdminHomeCategory,
  fetchAdminHomeCategories,
  fetchAdminProducts,
  updateAdminHomeCategory,
} from "../../services/api.js";
import { getProductImage } from "../../utils/assets.js";

const GRADIENT_PRESETS = [
  "from-fuchsia-500 via-rose-500 to-amber-400",
  "from-cyan-500 via-blue-500 to-indigo-500",
  "from-emerald-500 via-lime-500 to-amber-300",
  "from-purple-600 via-slate-700 to-black",
  "from-pink-500 via-orange-400 to-yellow-300",
  "from-slate-900 via-slate-700 to-slate-500",
];

const FALLBACK_PREVIEW_IMAGE =
  "https://placehold.co/200x200?text=Preview";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const resolvePriceInfo = (product) => {
  if (!product) return null;
  const finalPrice = Number(product.finalPrice ?? product.price ?? 0);
  const candidates = [
    product.oldPrice,
    product.basePrice,
    product.price,
  ]
    .map((value) =>
      typeof value === "number" && Number.isFinite(value) ? value : null
    )
    .filter((value) => value !== null);
  const originalPrice =
    candidates.find((value) => value > finalPrice) || null;

  return {
    finalPrice,
    originalPrice,
    hasDiscount: originalPrice !== null && originalPrice > finalPrice,
    promotionName: product.appliedPromotion?.name || null,
    discountPercent: product.appliedPromotion?.discountPercent ?? null,
  };
};

const CategoryPreviewCard = ({
  title,
  subtitle,
  gradient = GRADIENT_PRESETS[0],
  product,
}) => {
  const priceInfo = resolvePriceInfo(product);
  const imageSrc = product
    ? getProductImage(product, FALLBACK_PREVIEW_IMAGE)
    : FALLBACK_PREVIEW_IMAGE;
  const safeGradient = gradient || GRADIENT_PRESETS[0];

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${safeGradient} p-6 text-white shadow-lg`}
    >
      <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
        Hot pick
      </span>
      <h3 className="mt-4 text-2xl font-semibold leading-tight">
        {title || "Tiêu đề danh mục"}
      </h3>
      <p className="mt-1 text-sm text-white/80">
        {subtitle || "Thêm mô tả ngắn để thu hút khách hàng."}
      </p>
      <div className="mt-5 flex items-baseline gap-3">
        <span className="text-4xl font-bold">
          {priceInfo ? formatCurrency(priceInfo.finalPrice) : "—"}
        </span>
        {priceInfo?.hasDiscount ? (
          <span className="text-sm text-white/60 line-through">
            {formatCurrency(priceInfo.originalPrice)}
          </span>
        ) : null}
      </div>
      {priceInfo?.promotionName ? (
        <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/70">
          Ưu đãi: {priceInfo.promotionName}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-rose-500 shadow-lg shadow-rose-800/30 transition hover:-translate-y-0.5"
        >
          Mua ngay
        </button>
        <button
          type="button"
          className="rounded-full border border-white/40 px-6 py-2 text-sm font-semibold text-white/90 transition hover:-translate-y-0.5 hover:bg-white/10"
        >
          Xem chi tiết
        </button>
      </div>
      {product ? (
        <div className="pointer-events-none absolute -bottom-6 right-2 w-36">
          <img
            src={imageSrc}
            alt={product?.name || "Preview"}
            className="w-full object-contain drop-shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
            loading="lazy"
          />
        </div>
      ) : (
        <p className="mt-4 text-xs text-white/70">
          Chưa chọn sản phẩm nổi bật để hiển thị giá.
        </p>
      )}
    </div>
  );
};

const MAX_PRODUCTS = 12;

const emptyForm = {
  title: "",
  subtitle: "",
  gradient: GRADIENT_PRESETS[0],
  searchKeyword: "",
  productSlug: "",
  productSlugs: [],
  order: 0,
  isFeatured: true,
};

const ManageCategories = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [productOptions, setProductOptions] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productFilter, setProductFilter] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetchAdminHomeCategories();
      setRecords(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      toast.error("Không thể tải danh mục trang chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductLoading(true);
        const response = await fetchAdminProducts({ limit: 200 });
        setProductOptions(
          Array.isArray(response.data?.data) ? response.data.data : []
        );
      } catch (error) {
        toast.error("Khong the tai danh sach san pham.");
      } finally {
        setProductLoading(false);
      }
    };

    loadProducts();
  }, []);

  const productLookup = useMemo(() => {
    const map = {};
    productOptions.forEach((product) => {
      if (product?.slug) {
        map[product.slug] = product;
      }
    });
    return map;
  }, [productOptions]);

  const filteredProductOptions = useMemo(() => {
    const keyword = productFilter.trim().toLowerCase();
    if (!keyword) {
      return productOptions.slice(0, 6);
    }

    return productOptions
      .filter((product) => {
        const haystack = `${product.name || ""} ${product.slug || ""} ${
          product.brand || ""
        }`.toLowerCase();
        return haystack.includes(keyword);
      })
      .slice(0, 6);
  }, [productFilter, productOptions]);

  const selectedProducts = useMemo(
    () =>
      form.productSlugs.map((slug) => ({
        slug,
        product: productLookup[slug] || null,
      })),
    [form.productSlugs, productLookup]
  );

  const primaryPreviewProduct = useMemo(() => {
    if (form.productSlug && productLookup[form.productSlug]) {
      return productLookup[form.productSlug];
    }
    if (form.productSlug) {
      for (const record of records) {
        const match = Array.isArray(record.linkedProducts)
          ? record.linkedProducts.find(
              (item) => item?.slug === form.productSlug
            )
          : null;
        if (match) {
          return match;
        }
      }
    }
    return selectedProducts[0]?.product || null;
  }, [form.productSlug, productLookup, records, selectedProducts]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setForm({
      title: category.title ?? "",
      subtitle: category.subtitle ?? "",
      gradient: category.gradient ?? GRADIENT_PRESETS[0],
      searchKeyword: category.searchKeyword ?? "",
      productSlug: category.productSlug ?? "",
      productSlugs: Array.isArray(category.productSlugs)
        ? category.productSlugs
        : category.productSlug
        ? [category.productSlug]
        : [],
      order: category.order ?? 0,
      isFeatured:
        category.isFeatured === undefined ? true : Boolean(category.isFeatured),
    });
  };

  const handleReset = () => {
    setEditingId(null);
    setForm(emptyForm);
    setProductFilter("");
  };

  const handleAddProductSlug = (slug) => {
    if (!slug) return;
    setForm((prev) => {
      if (
        prev.productSlugs.includes(slug) ||
        prev.productSlugs.length >= MAX_PRODUCTS
      ) {
        return prev;
      }
      const nextSlugs = [...prev.productSlugs, slug];
      return {
        ...prev,
        productSlugs: nextSlugs,
        productSlug: prev.productSlug || slug,
      };
    });
  };

  const handleRemoveProductSlug = (slug) => {
    setForm((prev) => {
      const nextSlgs = prev.productSlugs.filter((item) => item !== slug);
      const nextProductSlug =
        prev.productSlug === slug ? nextSlgs[0] || "" : prev.productSlug;
      return {
        ...prev,
        productSlugs: nextSlgs,
        productSlug: nextProductSlug,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Tiêu đề không được bỏ trống.");
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await updateAdminHomeCategory(editingId, form);
        toast.success("Đã cập nhật danh mục.");
      } else {
        await createAdminHomeCategory(form);
        toast.success("Đã thêm danh mục.");
      }
      handleReset();
      await loadCategories();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể lưu danh mục trang chủ."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm("Xác nhận xoá danh mục này?")) return;
    try {
      await deleteAdminHomeCategory(categoryId);
      toast.success("Đã xoá danh mục.");
      if (editingId === categoryId) {
        handleReset();
      }
      await loadCategories();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể xoá danh mục trang chủ."
      );
    }
  };

  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          (a.order ?? 0) - (b.order ?? 0) ||
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [records]
  );

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-950/50 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
          Trang chủ
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Quản lý danh mục nổi bật
            </h1>
            <p className="text-sm text-slate-400">
              Tùy chỉnh các khối màu sắc xuất hiện dưới khu vực sản phẩm nổi bật
              trên trang chủ.
            </p>
          </div>
          <button
            type="button"
            onClick={loadCategories}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-brand-primary hover:text-brand-primary"
          >
            Làm mới
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-800 bg-slate-950/50 p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {editingId ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </h2>
            {editingId ? (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Huỷ chỉnh sửa
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4">
            <label className="text-sm text-slate-300">
              Tiêu đề
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-brand-primary"
                placeholder="Luxury Flagship"
                required
              />
            </label>
            <label className="text-sm text-slate-300">
              Mô tả ngắn
              <textarea
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                rows={2}
                className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-brand-primary"
                placeholder="Leica optics, zoom tiệm cận DSLR"
              />
            </label>

            <label className="text-sm text-slate-300">
              Gradient Tailwind
              <input
                name="gradient"
                value={form.gradient}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 font-mono text-xs text-emerald-200 outline-none focus:border-brand-primary"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      gradient: preset,
                    }))
                  }
                  className={`h-10 flex-1 rounded-2xl border border-white/10 bg-gradient-to-r ${preset} text-xs text-white transition hover:scale-[1.01]`}
                >
                  {preset.replace(/from-|via-|to-/g, "").slice(0, 20)}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Xem trước thẻ nổi bật
              </p>
              <CategoryPreviewCard
                title={form.title}
                subtitle={form.subtitle}
                gradient={form.gradient}
                product={primaryPreviewProduct}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                Từ khoá tìm kiếm
                <input
                  name="searchKeyword"
                  value={form.searchKeyword}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-brand-primary"
                  placeholder="gaming"
                />
              </label>
              <label className="text-sm text-slate-300">
                Product slug (tuỳ chọn)
                <input
                  name="productSlug"
                  value={form.productSlug}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-brand-primary"
                  placeholder="iphone-15-pro-max"
                />
              </label>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <span>
                  San pham goi y ({form.productSlugs.length}/{MAX_PRODUCTS})
                </span>
                {form.productSlugs.length ? (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        productSlugs: [],
                        productSlug: "",
                      }))
                    }
                    className="text-rose-300 transition hover:text-rose-200"
                  >
                    Xoa tat ca
                  </button>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {selectedProducts.length ? (
                  selectedProducts.map(({ slug, product }) => {
                    const priceInfo = product ? resolvePriceInfo(product) : null;
                    const finalPriceLabel = priceInfo
                      ? formatCurrency(priceInfo.finalPrice)
                      : product?.price
                      ? formatCurrency(product.price)
                      : null;
                    const originalPriceLabel =
                      priceInfo?.hasDiscount && priceInfo.originalPrice
                        ? formatCurrency(priceInfo.originalPrice)
                        : null;
                    return (
                      <div
                        key={slug}
                        className="inline-flex items-center gap-3 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs text-slate-200"
                      >
                        <div className="flex flex-col">
                          <span className="max-w-[200px] truncate font-semibold text-white">
                            {product?.name || slug}
                          </span>
                          {finalPriceLabel ? (
                            <span className="text-[11px] text-emerald-300">
                              {finalPriceLabel}
                              {originalPriceLabel ? (
                                <span className="ml-2 text-[10px] text-slate-400 line-through">
                                  {originalPriceLabel}
                                </span>
                              ) : null}
                            </span>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProductSlug(slug)}
                          className="text-slate-500 transition hover:text-rose-300"
                          aria-label={`Remove ${product?.name || slug}`}
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500">
                    Chua co san pham nao duoc chon.
                  </p>
                )}
              </div>

              <label className="mt-4 block text-xs text-slate-400">
                Tim san pham de them
                <input
                  type="search"
                  value={productFilter}
                  onChange={(event) => setProductFilter(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-brand-primary"
                  placeholder="Nhap ten hoac slug"
                />
              </label>

              <div className="mt-3 space-y-2">
                {productLoading ? (
                  <p className="text-xs text-slate-500">
                    Dang tai danh sach san pham...
                  </p>
                ) : filteredProductOptions.length ? (
                  filteredProductOptions.map((product) => {
                    const isSelected = form.productSlugs.includes(product.slug);
                    const priceInfo = resolvePriceInfo(product);
                    const finalPriceLabel = formatCurrency(
                      priceInfo?.finalPrice ?? product.price ?? 0
                    );
                    const originalPriceLabel =
                      priceInfo?.hasDiscount && priceInfo.originalPrice
                        ? formatCurrency(priceInfo.originalPrice)
                        : null;
                    return (
                      <button
                        type="button"
                        key={product._id}
                        onClick={() => handleAddProductSlug(product.slug)}
                        disabled={
                          isSelected || form.productSlugs.length >= MAX_PRODUCTS
                        }
                        className={`w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-left text-xs transition ${
                          isSelected
                            ? "opacity-60"
                            : "hover:border-brand-primary hover:text-white"
                        }`}
                      >
                        <p className="font-semibold text-white">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {(product.brand || "N/A").toUpperCase()} -{" "}
                          {product.slug}
                        </p>
                        <p className="text-[11px] text-emerald-300">
                          {finalPriceLabel}
                          {originalPriceLabel ? (
                            <span className="ml-2 text-[10px] text-slate-500 line-through">
                              {originalPriceLabel}
                            </span>
                          ) : null}
                        </p>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500">
                    Khong tim thay san pham phu hop.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                Thứ tự
                <input
                  type="number"
                  name="order"
                  value={form.order}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-brand-primary"
                />
              </label>
              <label className="mt-6 flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={form.isFeatured}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-brand-primary focus:ring-brand-primary"
                />
                Hiển thị trên trang chủ
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-brand-primary px-6 py-2 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm mới"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-slate-700 px-6 py-2 text-sm text-slate-300 transition hover:border-brand-primary hover:text-white"
              >
                Làm trống
              </button>
            </div>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/30 p-6">
          <h2 className="text-lg font-semibold text-white">Danh sách hiện có</h2>
﻿          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Đang tải...</p>
          ) : sortedRecords.length ? (
            <div className="mt-4 space-y-4">
              {sortedRecords.map((category) => {
                const heroProduct = Array.isArray(category.linkedProducts)
                  ? category.linkedProducts.find(
                      (item) => item?.slug === category.productSlug
                    ) || category.linkedProducts[0]
                  : null;
                const heroPriceInfo = heroProduct
                  ? resolvePriceInfo(heroProduct)
                  : null;
                return (
                  <div
                    key={category._id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-start gap-4">
                          <div
                            className={`h-14 w-14 rounded-2xl border border-white/10 bg-gradient-to-br ${category.gradient}`}
                          />
                          <div className="flex-1">
                            <p className="text-lg font-semibold text-white">
                              {category.title}
                            </p>
                            <p className="text-xs text-slate-400">
                              {category.subtitle}
                            </p>
                            <p className="text-xs text-slate-500">
                              Keyword: {category.searchKeyword || "—"} / Product:{" "}
                              {category.productSlug || "—"}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            <p>Thứ tự</p>
                            <p className="text-base font-semibold text-white">
                              {category.order ?? 0}
                            </p>
                          </div>
                        </div>
                        {heroProduct ? (
                          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                            <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-800">
                              <img
                                src={getProductImage(
                                  heroProduct,
                                  FALLBACK_PREVIEW_IMAGE
                                )}
                                alt={heroProduct.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {heroProduct.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {(heroProduct.brand || "").toUpperCase()}
                              </p>
                              <p className="text-sm font-semibold text-emerald-300">
                                {formatCurrency(
                                  heroPriceInfo?.finalPrice ??
                                    heroProduct.finalPrice ??
                                    heroProduct.price ??
                                    0
                                )}
                                {heroPriceInfo?.hasDiscount ? (
                                  <span className="ml-2 text-xs text-slate-500 line-through">
                                    {formatCurrency(heroPriceInfo.originalPrice)}
                                  </span>
                                ) : null}
                              </p>
                              {heroPriceInfo?.promotionName ? (
                                <p className="text-xs text-emerald-400">
                                  Ưu đãi: {heroPriceInfo.promotionName}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">
                            Chưa gắn sản phẩm nổi bật.
                          </p>
                        )}
                        {Array.isArray(category.productSlugs) &&
                        category.productSlugs.length ? (
                          <div className="flex flex-wrap gap-2">
                            {category.productSlugs.map((slug) => (
                              <span
                                key={`${category._id}-${slug}`}
                                className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                              >
                                {productLookup[slug]?.name || slug}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(category)}
                            className="rounded-full border border-slate-600 px-4 py-1 text-sm text-slate-200 transition hover:border-brand-primary hover:text-brand-primary"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category._id)}
                            className="rounded-full border border-rose-500/30 px-4 py-1 text-sm text-rose-300 transition hover:border-rose-500 hover:text-rose-200"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                      <div className="w-full lg:max-w-sm">
                        <CategoryPreviewCard
                          title={category.title}
                          subtitle={category.subtitle}
                          gradient={category.gradient}
                          product={heroProduct}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Chưa có danh mục nào được cấu hình.
            </p>
          )}

        </div>
      </section>
    </div>
  );
};

export default ManageCategories;
