import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { useAuth } from "../context/AuthContext.jsx";

const TIER_LABELS = {
  bronze: "Khách hàng đồng",
  silver: "Khách hàng bạc",
  gold: "Khách hàng vàng",
  diamond: "Khách hàng kim cương",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const Profile = () => {
  const { user, updateProfile, status } = useAuth();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
    });
  }, [user]);

  const tierLabel = useMemo(
    () => TIER_LABELS[user?.customerTier] || "Khách hàng đồng",
    [user?.customerTier]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      toast.error("Bạn cần đăng nhập để cập nhật thông tin");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      toast.error(
        error?.message || "Không thể cập nhật thông tin. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container-safe py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Bạn cần đăng nhập để xem trang này
        </h1>
      </div>
    );
  }

  return (
    <div className="container-safe py-12">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
          Hồ sơ
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Thông tin cá nhân
        </h1>
        <p className="max-w-2xl text-sm text-slate-500">
          Cập nhật số điện thoại và địa chỉ nhận hàng. Email đăng nhập được giữ
          cố định vì lý do bảo mật.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-600"
              >
                Họ và tên
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-600"
              >
                Số điện thoại
              </label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại liên hệ"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-slate-600"
              >
                Địa chỉ nhận hàng
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={form.address}
                onChange={handleChange}
                placeholder="Nhập địa chỉ giao hàng mặc định"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <span>Email đăng nhập</span>
              <span className="font-semibold text-slate-700">{user.email}</span>
            </div>

            <button
              type="submit"
              disabled={saving || status === "loading"}
              className="inline-flex w-full items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand-dark/50"
            >
              {saving || status === "loading"
                ? "Đang lưu thông tin..."
                : "Lưu thay đổi"}
            </button>
          </form>
        </section>

        <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Hạng khách hàng hiện tại
            </h2>
            <p className="mt-2 inline-flex rounded-full bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary">
              {tierLabel}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-6">
            <p className="text-sm font-medium text-slate-500">
              Tổng chi tiêu tích lũy
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(user.lifetimeSpend)}
            </p>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <h3 className="text-sm font-semibold text-slate-800">
              Quy định phân hạng
            </h3>
            <ul className="space-y-2">
              <li>• Kim cương: từ 50.000.000đ</li>
              <li>• Vàng: từ 20.000.000đ</li>
              <li>• Bạc: từ 10.000.000đ</li>
              <li>• Đồng: dưới 10.000.000đ</li>
            </ul>
            <p className="text-xs text-slate-400">
              Hạng sẽ được nâng tự động ngay khi đơn hàng giao thành công.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Profile;
