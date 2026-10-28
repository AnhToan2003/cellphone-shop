import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FiFolder,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiLayers,
  FiPackage,
} from "react-icons/fi";

import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  addAdminSubCategory,
  deleteAdminSubCategory,
} from "../../services/api.js";

const DEFAULT_ICONS = ["📱", "📟", "💻", "⌚", "🎧", "🥽", "🔌", "🛡️", "🍎", "⚡"];

const initialCategoryForm = {
  name: "",
  icon: "📱",
  description: "",
  subCategories: "",
  order: 0,
};

const ManageProductCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(initialCategoryForm);
  const [submitting, setSubmitting] = useState(false);

  // Quick inline add subcategory state per category: { [catId]: string }
  const [newSubInputs, setNewSubInputs] = useState({});
  const [addingSubFor, setAddingSubFor] = useState(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetchAdminCategories();
      setCategories(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      toast.error("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const totalSubCategories = categories.reduce(
    (sum, c) => sum + (c.subCategories?.length || 0),
    0
  );
  const totalProducts = categories.reduce(
    (sum, c) => sum + (c.productCount || 0),
    0
  );

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setForm({
      ...initialCategoryForm,
      order: categories.length + 1,
    });
    setShowAddForm(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name || "",
      icon: category.icon || "📱",
      description: category.description || "",
      subCategories: Array.isArray(category.subCategories)
        ? category.subCategories.join(", ")
        : "",
      order: category.order ?? 0,
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setForm(initialCategoryForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        icon: form.icon.trim() || "🍎",
        description: form.description.trim(),
        subCategories: form.subCategories,
        order: Number(form.order) || 0,
      };

      if (editingCategory) {
        await updateAdminCategory(editingCategory._id, payload);
        toast.success(`Cập nhật danh mục "${form.name}" thành công!`);
      } else {
        await createAdminCategory(payload);
        toast.success(`Thêm mới danh mục "${form.name}" thành công!`);
      }

      handleCancelForm();
      await loadCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Lỗi khi lưu danh mục");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    const confirm = window.confirm(
      `Bạn có chắc chắn muốn xóa danh mục "${category.name}"?\n(Toàn bộ danh mục con của "${category.name}" cũng sẽ bị xóa khỏi phân loại)`
    );
    if (!confirm) return;

    try {
      await deleteAdminCategory(category._id);
      toast.success(`Đã xóa danh mục "${category.name}"`);
      await loadCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể xóa danh mục");
    }
  };

  const handleAddSubCategory = async (categoryId) => {
    const subName = (newSubInputs[categoryId] || "").trim();
    if (!subName) {
      toast.error("Vui lòng nhập tên dòng máy / danh mục con");
      return;
    }

    try {
      setAddingSubFor(categoryId);
      await addAdminSubCategory(categoryId, subName);
      toast.success(`Đã thêm dòng sản phẩm "${subName}"`);
      setNewSubInputs((prev) => ({ ...prev, [categoryId]: "" }));
      await loadCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể thêm danh mục con");
    } finally {
      setAddingSubFor(null);
    }
  };

  const handleDeleteSubCategory = async (category, subName) => {
    const confirm = window.confirm(
      `Bạn có chắc chắn muốn xóa dòng máy "${subName}" khỏi danh mục "${category.name}"?`
    );
    if (!confirm) return;

    try {
      await deleteAdminSubCategory(category._id, subName);
      toast.success(`Đã xóa "${subName}"`);
      await loadCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể xóa danh mục con");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400 font-bold">
            Quản Trị Hệ Thống
          </p>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <FiFolder className="text-blue-500" />
            Quản Lý Danh Mục Sản Phẩm
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Tạo mới các danh mục Apple, phân luồng các dòng sản phẩm con chi tiết (sub-categories) cho Menu chính, Trang chủ và Bộ lọc sản phẩm.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 hover:-translate-y-0.5"
        >
          <FiPlus size={18} />
          <span>Thêm danh mục mới</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center gap-3 text-slate-400">
            <FiFolder size={20} className="text-blue-400" />
            <span className="text-xs uppercase tracking-wider font-semibold">
              Tổng danh mục chính
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white">{categories.length}</p>
          <p className="mt-1 text-xs text-slate-500">iPhone, iPad, Mac, Watch, Phụ kiện...</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center gap-3 text-slate-400">
            <FiLayers size={20} className="text-emerald-400" />
            <span className="text-xs uppercase tracking-wider font-semibold">
              Tổng dòng máy (Sub-categories)
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-400">{totalSubCategories}</p>
          <p className="mt-1 text-xs text-slate-500">Phân luồng dòng máy chi tiết</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center gap-3 text-slate-400">
            <FiPackage size={20} className="text-indigo-400" />
            <span className="text-xs uppercase tracking-wider font-semibold">
              Sản phẩm đang phân loại
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-indigo-400">{totalProducts}</p>
          <p className="mt-1 text-xs text-slate-500">Đã gán vào các danh mục</p>
        </div>
      </div>

      {/* Form Thêm / Sửa Danh Mục */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-blue-500/40 bg-gradient-to-b from-blue-950/20 via-slate-900/90 to-slate-950 p-6 shadow-xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-pulse" />
              <h2 className="text-lg font-bold text-white">
                {editingCategory ? `Chỉnh sửa danh mục: ${editingCategory.name}` : "Tạo danh mục mới"}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Tên danh mục */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200" htmlFor="cat-name">
                Tên danh mục <span className="text-rose-500">*</span>
              </label>
              <input
                id="cat-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Ví dụ: Vision Pro, Âm thanh Hi-Fi, Apple Watch..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              />
            </div>

            {/* Icon danh mục */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200">
                Icon biểu tượng
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-center text-lg text-white outline-none focus:border-blue-500"
                />
                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                  {DEFAULT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`h-9 w-9 rounded-lg border text-base transition flex items-center justify-center ${
                        form.icon === icon
                          ? "border-blue-500 bg-blue-600/30 scale-110"
                          : "border-slate-800 bg-slate-900 hover:border-slate-600"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mô tả danh mục */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-200" htmlFor="cat-desc">
                Mô tả ngắn danh mục
              </label>
              <input
                id="cat-desc"
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ví dụ: Thiết bị thực tế ảo mở rộng không gian điện toán cá nhân..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Danh mục con (Sub-categories) */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-200" htmlFor="cat-subs">
                Danh sách các dòng sản phẩm con (phân cách bằng dấu phẩy)
              </label>
              <textarea
                id="cat-subs"
                rows={2}
                value={form.subCategories}
                onChange={(e) => setForm({ ...form, subCategories: e.target.value })}
                placeholder="Ví dụ: Vision Pro 256GB, Vision Pro 512GB, Phụ kiện Vision Pro..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
              <p className="text-xs text-slate-500">
                Bạn cũng có thể thêm/xóa từng dòng máy nhanh chóng ngay trên thẻ danh mục bên dưới.
              </p>
            </div>

            {/* Thứ tự hiển thị */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200" htmlFor="cat-order">
                Thứ tự sắp xếp (Nhỏ hơn sẽ đứng trước)
              </label>
              <input
                id="cat-order"
                type="number"
                min="0"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                className="w-32 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCancelForm}
              className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition disabled:opacity-50"
            >
              <FiCheck size={16} />
              <span>{submitting ? "Đang lưu..." : editingCategory ? "Cập nhật danh mục" : "Tạo danh mục"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Danh sách các danh mục */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Đang tải danh mục...</div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          Chưa có danh mục nào. Hãy bấm &quot;Thêm danh mục mới&quot; ở trên.
        </div>
      ) : (
        <div className="grid gap-6">
          {categories.map((category) => {
            const subCategories = Array.isArray(category.subCategories)
              ? category.subCategories
              : [];
            const subInputVal = newSubInputs[category._id] || "";
            const isAddingThis = addingSubFor === category._id;

            return (
              <div
                key={category._id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-md transition hover:border-slate-700 space-y-5"
              >
                {/* Category Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-2xl shadow-sm">
                      {category.icon || "🍎"}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white tracking-wide">
                          {category.name}
                        </h2>
                        <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                          Thứ tự: {category.order ?? 0}
                        </span>
                        {category.productCount !== undefined && (
                          <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300">
                            {category.productCount} sản phẩm
                          </span>
                        )}
                      </div>
                      {category.description && (
                        <p className="mt-1 text-xs text-slate-400">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(category)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-blue-500 hover:text-white"
                      title="Sửa danh mục này"
                    >
                      <FiEdit2 size={13} />
                      <span>Sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 hover:text-white"
                      title="Xóa danh mục này"
                    >
                      <FiTrash2 size={13} />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>

                {/* Subcategories (Dòng sản phẩm chi tiết) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
                      <FiLayers className="text-blue-400" />
                      Các dòng sản phẩm con ({subCategories.length})
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {subCategories.length > 0 ? (
                      subCategories.map((sub) => (
                        <span
                          key={sub}
                          className="group inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-3.5 py-1.5 text-xs font-medium text-slate-200 shadow-sm transition hover:border-slate-500"
                        >
                          <span>{sub}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubCategory(category, sub)}
                            className="rounded-full text-slate-500 hover:bg-rose-950 hover:text-rose-400 p-0.5 transition"
                            title={`Xóa dòng máy "${sub}"`}
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs italic text-slate-500">
                        Chưa có dòng sản phẩm con nào.
                      </span>
                    )}

                    {/* Quick Add Subcategory Input */}
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-blue-500/40 bg-slate-950/60 p-1 pl-3">
                      <input
                        type="text"
                        value={subInputVal}
                        onChange={(e) =>
                          setNewSubInputs({
                            ...newSubInputs,
                            [category._id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSubCategory(category._id);
                          }
                        }}
                        placeholder="+ Thêm dòng máy mới..."
                        className="w-36 border-none bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSubCategory(category._id)}
                        disabled={isAddingThis || !subInputVal.trim()}
                        className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-30"
                      >
                        {isAddingThis ? "..." : "+ Thêm"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageProductCategories;
