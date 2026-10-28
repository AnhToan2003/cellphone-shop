import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { FiCheck, FiEye, FiEyeOff, FiSave, FiStar, FiSliders } from "react-icons/fi";

import { apiClient } from "../../api/axios.js";
import { getAssetUrl, getProductImage } from "../../utils/assets.js";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const initialBannerState = {
  title: "",
  description: "",
  link: "",
};

const ManageBanners = () => {
  const [activeTab, setActiveTab] = useState("spotlight"); // "spotlight" | "carousel"

  // Carousel Banners State
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(initialBannerState);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Spotlight Banner State
  const [allProducts, setAllProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [spotlightSaving, setSpotlightSaving] = useState(false);
  const [spotlightForm, setSpotlightForm] = useState({
    productId: "",
    badge: "SẢN PHẨM NỔI BẬT",
    title: "",
    description: "",
    customPrice: "",
    customOldPrice: "",
    customImage: "",
    isActive: true,
  });

  const isEditing = Boolean(editingId);

  // Load Carousel Banners
  const loadBanners = async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get("/banners");
      setBanners(data.data || []);
    } catch {
      toast.error("Không thể tải banner slider");
    } finally {
      setIsLoading(false);
    }
  };

  // Load Spotlight Configuration
  const loadSpotlight = async () => {
    try {
      const { data } = await apiClient.get("/spotlight");
      if (data.data) {
        const item = data.data;
        setSpotlightForm({
          productId: item.product?._id || item.product || "",
          badge: item.badge || "SẢN PHẨM NỔI BẬT",
          title: item.title || "",
          description: item.description || "",
          customPrice: item.customPrice !== null && item.customPrice !== undefined ? String(item.customPrice) : "",
          customOldPrice: item.customOldPrice !== null && item.customOldPrice !== undefined ? String(item.customOldPrice) : "",
          customImage: item.customImage || "",
          isActive: item.isActive !== false,
        });
      }
    } catch {
      toast.error("Không thể tải cấu hình sản phẩm nổi bật");
    }
  };

  // Load All Products for Selection
  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const { data } = await apiClient.get("/admin/products?limit=200");
      const list = data.items || data.products || data.data || [];
      setAllProducts(list);
    } catch {
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadBanners();
    loadSpotlight();
    loadProducts();
  }, []);

  // Handlers for Carousel Banners
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const [selected] = event.target.files;
    setFile(selected || null);
  };

  const resetForm = () => {
    setForm(initialBannerState);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (banner) => {
    setEditingId(banner._id);
    setForm({
      title: banner.title || "",
      description: banner.description || "",
      link: banner.link || "",
    });
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isEditing && !file) {
      toast.error("Vui lòng chọn hình banner");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (file) {
        formData.append("image", file);
      }

      const requestConfig = {
        headers: { "Content-Type": "multipart/form-data" },
      };

      if (isEditing) {
        const response = await apiClient.put(
          `/banners/${editingId}`,
          formData,
          requestConfig
        );
        if (response.data?.success) {
          toast.success("Đã cập nhật banner");
          handleCancelEdit();
          await loadBanners();
        }
      } else {
        const response = await apiClient.post("/banners/upload", formData, requestConfig);
        if (response.data?.success) {
          toast.success("Đã thêm banner mới");
          resetForm();
          await loadBanners();
        }
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (isEditing ? "Không thể cập nhật banner" : "Không thể thêm banner");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa banner này?")) {
      return;
    }

    try {
      await apiClient.delete(`/banners/${id}`);
      toast.success("Đã xóa banner");
      await loadBanners();
    } catch {
      toast.error("Không thể xóa banner");
    }
  };

  // Handlers for Spotlight Banner
  const handleSpotlightChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSpotlightForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectProduct = (productId) => {
    const found = allProducts.find((p) => p._id === productId);
    if (!found) return;

    setSpotlightForm((prev) => ({
      ...prev,
      productId: found._id,
      title: prev.title || found.name,
      description:
        prev.description ||
        found.shortDescription ||
        "Sở hữu ngay flagship mới nhất với ưu đãi đặc quyền và bảo hành chu đáo tại Ngọc Triết Store.",
    }));
  };

  const handleSaveSpotlight = async (e) => {
    e?.preventDefault?.();
    try {
      setSpotlightSaving(true);
      const payload = {
        productId: spotlightForm.productId || undefined,
        badge: spotlightForm.badge,
        title: spotlightForm.title,
        description: spotlightForm.description,
        customPrice: spotlightForm.customPrice ? Number(spotlightForm.customPrice) : null,
        customOldPrice: spotlightForm.customOldPrice ? Number(spotlightForm.customOldPrice) : null,
        customImage: spotlightForm.customImage,
        isActive: spotlightForm.isActive,
      };

      const { data } = await apiClient.put("/spotlight", payload);
      if (data.success) {
        toast.success("Đã lưu cài đặt Banner Sản Phẩm Nổi Bật!");
        await loadSpotlight();
      }
    } catch {
      toast.error("Không thể lưu cấu hình banner nổi bật");
    } finally {
      setSpotlightSaving(false);
    }
  };

  // Resolve Preview Data
  const selectedProduct =
    allProducts.find((p) => p._id === spotlightForm.productId) ||
    allProducts[0] ||
    null;

  const previewTitle = spotlightForm.title || selectedProduct?.name || "Tên sản phẩm nổi bật";
  const previewBadge = spotlightForm.badge || "SẢN PHẨM NỔI BẬT";
  const previewDesc =
    spotlightForm.description ||
    selectedProduct?.shortDescription ||
    "Sở hữu ngay flagship mới nhất với ưu đãi đặc quyền và bảo hành chu đáo tại Ngọc Triết Store.";

  const previewPrice = spotlightForm.customPrice
    ? Number(spotlightForm.customPrice)
    : Number(selectedProduct?.finalPrice || selectedProduct?.price || 0);

  const previewOldPrice = spotlightForm.customOldPrice
    ? Number(spotlightForm.customOldPrice)
    : Number(selectedProduct?.oldPrice || 0);

  const previewImage = spotlightForm.customImage
    ? getAssetUrl(spotlightForm.customImage)
    : selectedProduct
    ? getProductImage(selectedProduct)
    : "https://placehold.co/400x400?text=Apple+Product";

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400 font-bold">
            Banner &amp; Nổi Bật
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-white">
            Quản Lý Banner &amp; Sản Phẩm Nổi Bật
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Điều chỉnh Banner Sản Phẩm Nổi Bật (Spotlight) và Slider ảnh trên trang chủ Ngọc Triết Store.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("spotlight")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "spotlight"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FiStar className={activeTab === "spotlight" ? "text-amber-300" : ""} />
            <span>Sản Phẩm Nổi Bật (Spotlight)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("carousel")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "carousel"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FiSliders />
            <span>Slider Carousel Trang Chủ</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* TAB 1: SPOTLIGHT BANNER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "spotlight" && (
        <div className="space-y-8 animate-fade-in-up">
          {/* LIVE PREVIEW BANNER (EXACT MATCH TO HOMEPAGE SPOTLIGHT) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                Xem trước giao diện Banner trên Trang Chủ (Live Preview)
              </h2>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                spotlightForm.isActive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}>
                {spotlightForm.isActive ? <FiEye size={13} /> : <FiEyeOff size={13} />}
                {spotlightForm.isActive ? "Đang bật trên trang chủ" : "Đang tạm ẩn"}
              </span>
            </div>

            {/* Preview Banner Container */}
            <div className={`relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl transition-all ${
              !spotlightForm.isActive ? "opacity-40 grayscale" : ""
            }`}>
              {/* Background ambient backdrop */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <img
                  src={previewImage}
                  alt={previewTitle}
                  className="h-full w-full object-cover mix-blend-overlay"
                />
              </div>

              <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                <div className="space-y-3.5 max-w-xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                    {previewBadge}
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white tracking-tight">
                    {previewTitle}
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {previewDesc}
                  </p>

                  <div className="flex flex-wrap items-baseline gap-3 pt-1">
                    <span className="text-3xl font-extrabold text-blue-400">
                      {formatCurrency(previewPrice)}
                    </span>
                    {previewOldPrice && previewOldPrice > previewPrice ? (
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(previewOldPrice)}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 pointer-events-none"
                    >
                      Xem chi tiết
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white pointer-events-none"
                    >
                      Khám phá thêm
                    </button>
                  </div>
                </div>

                {/* Right image card */}
                <div className="relative mt-4 flex w-full items-center justify-center lg:mt-0 lg:w-auto">
                  <div className="relative p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
                    <img
                      src={previewImage}
                      alt={previewTitle}
                      className="h-52 w-52 sm:h-60 sm:w-60 object-contain drop-shadow-2xl transition duration-500 hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SPOTLIGHT CONFIGURATION FORM */}
          <form
            onSubmit={handleSaveSpotlight}
            className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-blue-400">⚙️</span> Cấu Hình Banner Sản Phẩm Nổi Bật
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Chọn sản phẩm bạn muốn đưa lên vị trí trang trọng nhất trang chủ và tùy chỉnh nội dung theo ý muốn.
                </p>
              </div>

              {/* Show / Hide Toggle Button */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-300">
                  Hiển thị trên trang chủ:
                </span>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={spotlightForm.isActive}
                  onChange={handleSpotlightChange}
                  className="sr-only"
                />
                <div className={`relative h-6 w-11 rounded-full transition ${
                  spotlightForm.isActive ? "bg-blue-600" : "bg-slate-700"
                }`}>
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    spotlightForm.isActive ? "translate-x-5" : ""
                  }`} />
                </div>
                <span className={`text-xs font-bold ${spotlightForm.isActive ? "text-blue-400" : "text-slate-500"}`}>
                  {spotlightForm.isActive ? "BẬT" : "TẮT"}
                </span>
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Product Selector */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <span>📱</span> Chọn sản phẩm làm nổi bật <span className="text-rose-400">*</span>
                </label>
                <select
                  name="productId"
                  value={spotlightForm.productId}
                  onChange={(e) => {
                    handleSpotlightChange(e);
                    handleSelectProduct(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                  disabled={isLoadingProducts}
                >
                  <option value="">-- Chọn sản phẩm từ kho hàng --</option>
                  {allProducts.map((prod) => (
                    <option key={prod._id} value={prod._id}>
                      {prod.name} — {formatCurrency(prod.finalPrice || prod.price)} ({prod.category || "Apple"})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">
                  Khi chọn một sản phẩm, hệ thống tự động đồng bộ hình ảnh, giá bán và liên kết chi tiết của sản phẩm đó.
                </p>
              </div>

              {/* Badge */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">
                  Huy hiệu nổi bật (Badge)
                </label>
                <input
                  name="badge"
                  value={spotlightForm.badge}
                  onChange={handleSpotlightChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                  placeholder="SẢN PHẨM NỔI BẬT hoặc FLAGSHIP MỚI NHẤT..."
                />
              </div>

              {/* Title Override */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">
                  Tiêu đề hiển thị (Mặc định dùng tên máy)
                </label>
                <input
                  name="title"
                  value={spotlightForm.title}
                  onChange={handleSpotlightChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                  placeholder={selectedProduct?.name || "iPhone 16 Pro Max"}
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-200">
                  Mô tả ngắn nổi bật
                </label>
                <textarea
                  name="description"
                  value={spotlightForm.description}
                  onChange={handleSpotlightChange}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                  placeholder="Sở hữu ngay flagship mới nhất với ưu đãi đặc quyền và bảo hành chu đáo tại Ngọc Triết Store..."
                />
              </div>

              {/* Custom Price Overrides */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">
                  Giá bán hiển thị (₫) <span className="text-xs font-normal text-slate-400">— để trống nếu dùng giá sản phẩm</span>
                </label>
                <input
                  name="customPrice"
                  type="number"
                  value={spotlightForm.customPrice}
                  onChange={handleSpotlightChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                  placeholder={String(selectedProduct?.finalPrice || selectedProduct?.price || "")}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">
                  Giá niêm yết cũ (₫) <span className="text-xs font-normal text-slate-400">— để trống nếu không có</span>
                </label>
                <input
                  name="customOldPrice"
                  type="number"
                  value={spotlightForm.customOldPrice}
                  onChange={handleSpotlightChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                  placeholder={String(selectedProduct?.oldPrice || "")}
                />
              </div>

              {/* Custom Image URL */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-200">
                  URL ảnh đại diện tùy chỉnh <span className="text-xs font-normal text-slate-400">— để trống để tự động lấy ảnh sản phẩm</span>
                </label>
                <input
                  name="customImage"
                  value={spotlightForm.customImage}
                  onChange={handleSpotlightChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                  placeholder="https://... hoặc đường dẫn ảnh máy"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={spotlightSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
              >
                <FiSave />
                <span>{spotlightSaving ? "Đang lưu cấu hình..." : "Lưu Banner Nổi Bật"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CAROUSEL BANNER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "carousel" && (
        <div className="space-y-8 animate-fade-in-up">
          <form
            onSubmit={handleSubmit}
            className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40"
          >
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {isEditing ? "Chỉnh sửa slide banner" : "Thêm slide banner mới"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Các slide sẽ tự động chuyển động trên slider đầu trang chủ.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="banner-title" className="block text-sm font-semibold text-slate-300">
                  Tiêu đề slide
                </label>
                <input
                  id="banner-title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                  placeholder="Siêu ưu đãi ra mắt iPhone 16 Series"
                />
              </div>
              <div>
                <label htmlFor="banner-link" className="block text-sm font-semibold text-slate-300">
                  Đường dẫn khi bấm vào
                </label>
                <input
                  id="banner-link"
                  name="link"
                  value={form.link}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                  placeholder="/products?category=iPhone"
                />
              </div>
            </div>

            <div>
              <label htmlFor="banner-description" className="block text-sm font-semibold text-slate-300">
                Mô tả slide
              </label>
              <textarea
                id="banner-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                placeholder="Nêu bật chương trình khuyến mãi, quà tặng kèm..."
              />
            </div>

            <div>
              <label htmlFor="banner-image" className="block text-sm font-semibold text-slate-300">
                Hình ảnh banner slider
              </label>
              <input
                id="banner-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                ref={fileInputRef}
                required={!isEditing}
                className="mt-2 w-full rounded-xl border border-dashed border-slate-700 px-4 py-3 text-sm text-slate-300 outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={isEditing ? handleCancelEdit : resetForm}
                className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                disabled={isSubmitting}
              >
                {isEditing ? "Hủy chỉnh sửa" : "Làm mới"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? "Đang xử lý..." : isEditing ? "Lưu thay đổi" : "Thêm banner mới"}
              </button>
            </div>
          </form>

          {/* List of Carousel Banners */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-64 animate-pulse rounded-3xl bg-slate-800/60" />
              ))
            ) : banners.length ? (
              banners.map((banner) => (
                <div
                  key={banner._id}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-lg shadow-slate-950/30"
                >
                  <div className="relative h-48 w-full bg-slate-800">
                    <img
                      src={getAssetUrl(banner.imageUrl)}
                      alt={banner.title || "Banner"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-2 px-5 py-4">
                    <h3 className="text-lg font-semibold text-white">
                      {banner.title || "Banner khuyến mãi"}
                    </h3>
                    {banner.description && (
                      <p className="text-sm text-slate-400 line-clamp-2">{banner.description}</p>
                    )}
                    {banner.link && (
                      <p className="text-xs text-blue-400 font-mono truncate">{banner.link}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleEdit(banner)}
                        className="inline-flex items-center rounded-full border border-blue-500/50 px-4 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-600 hover:text-white"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(banner._id)}
                        className="inline-flex items-center rounded-full border border-rose-500/40 px-4 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-600 hover:text-white"
                      >
                        Xóa banner
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="md:col-span-2 xl:col-span-3 rounded-3xl border border-dashed border-slate-800 bg-slate-900/60 p-12 text-center text-sm text-slate-400">
                Chưa có banner nào. Hãy bắt đầu bằng cách thêm một banner mới!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBanners;
