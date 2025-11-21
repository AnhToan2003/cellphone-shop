import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import {
  createAdminBrand,
  deleteAdminBrand,
  fetchAdminBrands,
  updateAdminBrand,
} from "../../services/api.js";
import { getAssetUrl } from "../../utils/assets.js";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  country: "",
  logoUrl: "",
  website: "",
  order: 0,
  isFeatured: true,
};

const slugify = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ManageBrands = () => {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const response = await fetchAdminBrands();
      setRecords(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      toast.error("Không thể tải danh sách thương hiệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === "slug") {
      setSlugTouched(true);
    }
    setForm((prev) => {
      const nextValue = type === "checkbox" ? checked : value;
      const next = { ...prev, [name]: nextValue };
      if (name === "name" && !slugTouched && (!editingId || !prev.slug)) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleEdit = (brand) => {
    setEditingId(brand._id);
    setForm({
      name: brand.name ?? "",
      slug: brand.slug ?? "",
      description: brand.description ?? "",
      country: brand.country ?? "",
      logoUrl: brand.logoUrl ?? "",
      website: brand.website ?? "",
      order: brand.order ?? 0,
      isFeatured:
        brand.isFeatured === undefined ? true : Boolean(brand.isFeatured),
    });
    setSlugTouched(true);
  };

  const handleReset = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSlugTouched(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Tên thương hiệu không được bỏ trống.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      country: form.country.trim(),
      logoUrl: form.logoUrl.trim(),
      website: form.website.trim(),
      order: Number.isFinite(Number(form.order)) ? Number(form.order) : 0,
      isFeatured: Boolean(form.isFeatured),
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateAdminBrand(editingId, payload);
        toast.success("Đã cập nhật thương hiệu.");
      } else {
        await createAdminBrand(payload);
        toast.success("Đã thêm thương hiệu mới.");
      }
      handleReset();
      await loadBrands();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể lưu thương hiệu. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brandId) => {
    if (!window.confirm("Xác nhận xóa thương hiệu này?")) return;
    try {
      await deleteAdminBrand(brandId);
      toast.success("Đã xóa thương hiệu.");
      if (editingId === brandId) {
        handleReset();
      }
      await loadBrands();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể xóa thương hiệu. Vui lòng thử lại."
      );
    }
  };

  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          (a.order ?? 0) - (b.order ?? 0) ||
          (a.name || "").localeCompare(b.name || "")
      ),
    [records]
  );

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-950/50 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
          Thương hiệu
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Quản lý danh mục thương hiệu
            </h1>
            <p className="text-sm text-slate-400">
              Tạo danh sách thương hiệu chuẩn để sử dụng trong form sản phẩm và
              trang chủ.
            </p>
          </div>
          <button
            type="button"
            onClick={loadBrands}
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
              {editingId ? "Chỉnh sửa thương hiệu" : "Thêm thương hiệu mới"}
            </h2>
            {editingId ? (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Hủy chỉnh sửa
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                Tên thương hiệu
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-brand-primary"
                  placeholder="Apple"
                />
              </label>
              <label className="text-sm text-slate-300">
                Slug
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 font-mono text-xs text-emerald-200 outline-none focus:border-brand-primary"
                  placeholder="apple"
                />
              </label>
            </div>

            <label className="text-sm text-slate-300">
              Mô tả ngắn
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-brand-primary"
                placeholder="Flagship smartphone, tablet, phụ kiện cao cấp..."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                Quốc gia
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-brand-primary"
                  placeholder="USA"
                />
              </label>
              <label className="text-sm text-slate-300">
                Website
                <input
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-brand-primary"
                  placeholder="https://www.apple.com"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                Logo URL
                <input
                  name="logoUrl"
                  value={form.logoUrl}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-brand-primary"
                  placeholder="https://..."
                />
              </label>
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
            </div>

            <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-brand-primary focus:ring-brand-primary"
              />
              Hiển thị trên trang chủ và bộ lọc
            </label>

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
                Làm mới form
              </button>
            </div>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/30 p-6">
          <h2 className="text-lg font-semibold text-white">
            Danh sách thương hiệu
          </h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Đang tải...</p>
          ) : sortedRecords.length ? (
            <div className="mt-4 space-y-4">
              {sortedRecords.map((brand) => (
                <div
                  key={brand._id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-slate-900/70">
                        <img
                          src={
                            getAssetUrl(brand.logoUrl) ||
                            "https://placehold.co/56x56?text=Brand"
                          }
                          alt={brand.name}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">
                          {brand.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {brand.slug}
                          {brand.country ? ` · ${brand.country}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                        Thứ tự: {brand.order ?? 0}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          brand.isFeatured
                            ? "border-emerald-500/40 text-emerald-300"
                            : "border-slate-700 text-slate-400"
                        }`}
                      >
                        {brand.isFeatured ? "Đang hiển thị" : "Ẩn"}
                      </span>
                    </div>
                  </div>
                  {brand.description ? (
                    <p className="mt-3 text-sm text-slate-400">
                      {brand.description}
                    </p>
                  ) : null}
                  {brand.website ? (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center text-xs font-semibold text-brand-primary hover:underline"
                    >
                      {brand.website}
                    </a>
                  ) : null}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(brand)}
                      className="rounded-full border border-slate-600 px-4 py-1 text-sm text-slate-200 transition hover:border-brand-primary hover:text-brand-primary"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(brand._id)}
                      className="rounded-full border border-rose-500/30 px-4 py-1 text-sm text-rose-300 transition hover:border-rose-500 hover:text-rose-200"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Chưa có thương hiệu nào được tạo.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ManageBrands;
