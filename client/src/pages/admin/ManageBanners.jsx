import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { apiClient } from "../../api/axios.js";

const initialState = {
  title: "",
  description: "",
  link: "",
};

const ManageBanners = () => {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(initialState);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);

  const loadBanners = async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get("/banners");
      setBanners(data.data || []);
    } catch (error) {
      toast.error("Không thể tải banner");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

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
    setForm(initialState);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      toast.error("Vui lòng chọn hình banner");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      formData.append("image", file);

      const response = await apiClient.post("/banners/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        toast.success("Đã thêm banner mới");
        resetForm();
        await loadBanners();
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Không thể thêm banner";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa banner này?")) {
      return;
    }

    try {
      await apiClient.delete(`/banners/${id}`);
      toast.success("Đã xóa banner");
      await loadBanners();
    } catch (error) {
      const message =
        error.response?.data?.message || "Không thể xóa banner";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
          Banner
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-white">Quản lý banner</h1>
        <p className="mt-2 text-sm text-slate-400">
          Tải lên banner mới và điều chỉnh nội dung xuất hiện trên slider trang chủ.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="banner-title" className="block text-sm font-semibold text-slate-300">
              Tiêu đề
            </label>
            <input
              id="banner-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
              placeholder="Siêu ưu đãi ra mắt"
            />
          </div>
          <div>
            <label htmlFor="banner-link" className="block text-sm font-semibold text-slate-300">
              Đường dẫn
            </label>
            <input
              id="banner-link"
              name="link"
              value={form.link}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
              placeholder="https://cellphoneshop.vn/promotion"
            />
          </div>
        </div>
        <div>
          <label htmlFor="banner-description" className="block text-sm font-semibold text-slate-300">
            Mô tả
          </label>
          <textarea
            id="banner-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
            placeholder="Nhấn mạnh ưu đãi đặc biệt..."
          />
        </div>
        <div>
          <label htmlFor="banner-image" className="block text-sm font-semibold text-slate-300">
            Hình ảnh banner
          </label>
          <input
            id="banner-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            ref={fileInputRef}
            required
            className="mt-2 w-full rounded-xl border border-dashed border-slate-700 px-4 py-3 text-sm text-slate-300 outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-brand-primary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-brand-primary hover:text-white"
            disabled={isSubmitting}
          >
            Làm mới
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand-dark/50"
          >
            {isSubmitting ? "Đang tải lên..." : "Thêm banner"}
          </button>
        </div>
      </form>

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
                  src={banner.imageUrl}
                  alt={banner.title || "Banner"}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2 px-5 py-4">
                <h3 className="text-lg font-semibold text-white">
                  {banner.title || "Banner khuyến mãi"}
                </h3>
                {banner.description && (
                  <p className="text-sm text-slate-400">{banner.description}</p>
                )}
                {banner.link && (
                  <a
                    href={banner.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm font-semibold text-brand-primary hover:text-brand-light"
                  >
                    Xem đường dẫn →
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(banner._id)}
                  className="mt-3 inline-flex items-center rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500 hover:text-white"
                >
                  Xóa banner
                </button>
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
  );
};

export default ManageBanners;
