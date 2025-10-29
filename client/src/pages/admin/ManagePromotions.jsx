import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import {
  createAdminPromotion,
  deleteAdminPromotion,
  fetchAdminProducts,
  fetchAdminPromotions,
  updateAdminPromotion,
} from "../../services/api.js";

const CUSTOMER_TIERS = [
  { value: "bronze", label: "Khách hàng Đồng" },
  { value: "silver", label: "Khách hàng Bạc" },
  { value: "gold", label: "Khách hàng Vàng" },
  { value: "diamond", label: "Khách hàng Kim cương" },
];

const SCOPE_OPTIONS = [
  { value: "global", label: "Toàn cửa hàng" },
  { value: "product", label: "Theo sản phẩm" },
  { value: "customerTier", label: "Theo hạng khách hàng" },
];

const normalizeDateTimeLocal = (rawValue) => {
  if (!rawValue) return "";
  const trimmed = String(rawValue).trim();
  if (!trimmed) return "";

  let working = trimmed.replace(/--:--/gi, "00:00").replace(/--/g, "00");
  const whitespaceIndex = working.indexOf(" ");
  if (whitespaceIndex !== -1) {
    working = working.slice(0, whitespaceIndex);
  }
  working = working.replace(/z$/i, "");
  const plusIndex = working.indexOf("+");
  if (plusIndex !== -1) {
    working = working.slice(0, plusIndex);
  }
  const isoCandidate = working.replace(/[^0-9T:-]/g, "");

  const dateOnlyMatch = isoCandidate.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dateOnlyMatch) {
    return dateOnlyMatch[1];
  }

  const dateWithTrailingT = isoCandidate.match(/^(\d{4}-\d{2}-\d{2})T$/);
  if (dateWithTrailingT) {
    return dateWithTrailingT[1];
  }

  const dateHourMatch = isoCandidate.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})$/);
  if (dateHourMatch) {
    return dateHourMatch[1];
  }

  const dateHourMinuteMatch = isoCandidate.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2})(?::?(\d{2}))?$/
  );
  if (dateHourMinuteMatch) {
    const [ , datePart ] = dateHourMinuteMatch;
    return datePart;
  }

  const match = working.match(
    /^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2})(?::?(\d{2}))?)?/
  );
  if (match) {
    const [, datePart] = match;
    return datePart;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slashMatch) {
    let [, part1, part2, yearPart] = slashMatch;
    const first = Number.parseInt(part1, 10);
    const second = Number.parseInt(part2, 10);
    const resolvedYear =
      yearPart.length === 2
        ? Number.parseInt(yearPart, 10) + 2000
        : Number.parseInt(yearPart, 10);
    if (Number.isNaN(resolvedYear)) {
      return "";
    }
    let month = first;
    let day = second;
    if (first > 12 && second <= 12) {
      month = second;
      day = first;
    }
    const normalized = new Date(resolvedYear, (month || 1) - 1, day || 1);
    const normalizedYear = normalized.getFullYear();
    const normalizedMonth = String(normalized.getMonth() + 1).padStart(2, "0");
    const normalizedDay = String(normalized.getDate()).padStart(2, "0");
    return `${normalizedYear}-${normalizedMonth}-${normalizedDay}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialForm = {
  name: "",
  description: "",
  scope: "global",
  discountPercent: 10,
  startAt: "",
  endAt: "",
  products: [],
  customerTiers: [],
};

const ManagePromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [promotionRes, productRes] = await Promise.all([
        fetchAdminPromotions(),
        fetchAdminProducts(),
      ]);
      setPromotions(
        Array.isArray(promotionRes?.data?.data) ? promotionRes.data.data : []
      );
      setProducts(
        Array.isArray(productRes?.data?.data) ? productRes.data.data : []
      );
    } catch (error) {
      toast.error("Không thể tải dữ liệu khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product._id,
        label: product.name,
      })),
    [products]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "scope") {
      setForm((prev) => ({
        ...prev,
        scope: value,
        products: value === "product" ? prev.products : [],
        customerTiers: value === "customerTier" ? prev.customerTiers : [],
      }));
      return;
    }

    if (name === "startAt" || name === "endAt") {
      setForm((prev) => ({
        ...prev,
        [name]: normalizeDateTimeLocal(value),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (collection, selectedValue) => {
    setForm((prev) => {
      const current = new Set(prev[collection]);
      if (current.has(selectedValue)) {
        current.delete(selectedValue);
      } else {
        current.add(selectedValue);
      }
      return {
        ...prev,
        [collection]: Array.from(current),
      };
    });
  };

  const resetForm = () => {
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.startAt && form.endAt) {
      const startDate = new Date(`${form.startAt}T00:00:00`);
      const endDate = new Date(`${form.endAt}T00:00:00`);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        toast.error("Vui lòng chọn thời gian hợp lệ");
        return;
      }
      if (endDate < startDate) {
        toast.error("Thời gian kết thúc phải sau thời gian bắt đầu");
        return;
      }
    }

    setSubmitting(true);
    try {
      const toIsoString = (dateString) =>
        dateString ? new Date(`${dateString}T00:00:00`).toISOString() : undefined;

      const payload = {
        ...form,
        discountPercent: Number(form.discountPercent),
        startAt: toIsoString(form.startAt),
        endAt: toIsoString(form.endAt),
      };

      if (payload.scope !== "product") {
        payload.products = [];
      }
      if (payload.scope !== "customerTier") {
        payload.customerTiers = [];
      }
      if (Array.isArray(payload.products)) {
        payload.products = payload.products.filter(Boolean);
      }
      if (Array.isArray(payload.customerTiers)) {
        payload.customerTiers = payload.customerTiers.filter(Boolean);
      }

      await createAdminPromotion(payload);
      toast.success("Đã tạo khuyến mãi");
      resetForm();
      await loadData();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Không thể tạo khuyến mãi";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (promotion) => {
    setUpdatingId(promotion._id);
    try {
      await updateAdminPromotion(promotion._id, {
        isActive: !promotion.isActive,
      });
      toast.success("Đã cập nhật trạng thái chương trình");
      await loadData();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Không thể cập nhật trạng thái khuyến mãi";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (promotion) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xoá khuyến mãi "${promotion.name}"?`
    );
    if (!confirmed) return;

    setUpdatingId(promotion._id);
    try {
      await deleteAdminPromotion(promotion._id);
      toast.success("Đã xoá khuyến mãi");
      await loadData();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Không thể xoá khuyến mãi";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const requiresProducts = form.scope === "product";
  const requiresTiers = form.scope === "customerTier";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
          Khuyến mãi
        </p>
        <h1 className="text-3xl font-semibold text-white">Quản lý đợt giảm giá</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Thiết lập các chương trình ưu đãi theo sản phẩm, theo hạng khách hàng hoặc phủ
          toàn bộ cửa hàng để thu hút người mua.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="name">
              Tên chương trình
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
              placeholder="Ví dụ: Flash Sale cuối tuần"
            />
          </div>
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-slate-300"
              htmlFor="promotion-scope"
            >
              Phạm vi áp dụng
            </label>
            <select
              id="promotion-scope"
              name="scope"
              value={form.scope}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
            >
              {SCOPE_OPTIONS.map((scope) => (
                <option key={scope.value} value={scope.value}>
                  {scope.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300" htmlFor="description">
            Mô tả
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
            placeholder="Ghi chú nội dung ưu đãi, điều kiện áp dụng..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="discount">
              Mức giảm (%)
            </label>
            <input
              id="discount"
              name="discountPercent"
              type="number"
              min="0"
              max="100"
              value={form.discountPercent}
              onChange={handleChange}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="startAt">
              Bắt đầu
            </label>
            <input
              id="startAt"
              name="startAt"
              type="date"
              value={form.startAt}
              onChange={handleChange}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="endAt">
              Kết thúc
            </label>
            <input
              id="endAt"
              name="endAt"
              type="date"
              value={form.endAt}
              onChange={handleChange}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
              placeholder="YYYY-MM-DD"
            />
          </div>
        </div>

        {requiresProducts && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-300">Áp dụng cho sản phẩm</p>
            <div className="grid gap-2 md:grid-cols-2">
              {productOptions.map((product) => (
                <label
                  key={product.value}
                  className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition hover:border-brand-primary"
                >
                  <input
                    type="checkbox"
                    checked={form.products.includes(product.value)}
                    onChange={() => handleCheckboxChange("products", product.value)}
                  />
                  <span>{product.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {requiresTiers && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-300">Áp dụng cho hạng khách</p>
            <div className="grid gap-2 md:grid-cols-2">
              {CUSTOMER_TIERS.map((tier) => (
                <label
                  key={tier.value}
                  className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition hover:border-brand-primary"
                >
                  <input
                    type="checkbox"
                    checked={form.customerTiers.includes(tier.value)}
                    onChange={() => handleCheckboxChange("customerTiers", tier.value)}
                  />
                  <span>{tier.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand-dark/50"
          >
            {submitting ? "Đang tạo..." : "Tạo khuyến mãi"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Danh sách khuyến mãi</h2>
          <span className="rounded-full border border-slate-700 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
            {promotions.length} chương trình
          </span>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-800/60" />
            ))}
          </div>
        ) : promotions.length ? (
          <div className="mt-6 space-y-4">
            {promotions.map((promotion) => (
              <div
                key={promotion._id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {promotion.name}
                    </h3>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {promotion.scope === "global"
                        ? "Toàn bộ sản phẩm"
                        : promotion.scope === "product"
                        ? "Theo sản phẩm"
                        : "Theo hạng khách hàng"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      promotion.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {promotion.isActive ? "Đang hoạt động" : "Đã tạm dừng"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-400">
                  <p>
                    <span className="font-semibold text-slate-200">Mức giảm:</span>{" "}
                    {promotion.discountPercent}%
                  </p>
                  {promotion.description && <p>{promotion.description}</p>}
                  {promotion.customerTierLabels?.length ? (
                    <p>
                      <span className="font-semibold text-slate-200">
                        Hạng áp dụng:
                      </span>{" "}
                      {promotion.customerTierLabels.join(", ")}
                    </p>
                  ) : null}
                  {promotion.products?.length ? (
                    <div>
                      <p className="font-semibold text-slate-200">
                        Sản phẩm áp dụng:
                      </p>
                      <ul className="ml-4 list-disc space-y-1 text-slate-400">
                        {promotion.products.map((product) => (
                          <li key={product._id || product}>
                            {product.name || product}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <p>
                    <span className="font-semibold text-slate-200">Thời gian:</span>{" "}
                    {promotion.startAt
                      ? new Date(promotion.startAt).toLocaleString("vi-VN")
                      : "Áp dụng ngay"}{" "}
                    →{" "}
                    {promotion.endAt
                      ? new Date(promotion.endAt).toLocaleString("vi-VN")
                      : "Không giới hạn"}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(promotion)}
                    disabled={updatingId === promotion._id}
                    className="rounded-full border border-brand-primary/50 px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {promotion.isActive ? "Tạm dừng" : "Kích hoạt"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(promotion)}
                    disabled={updatingId === promotion._id}
                    className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
            Chưa có chương trình nào. Tạo khuyến mãi mới để bắt đầu thu hút khách hàng!
          </div>
        )}
      </section>
    </div>
  );
};

export default ManagePromotions;
