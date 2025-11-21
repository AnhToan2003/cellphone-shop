import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAuth } from "../context/AuthContext.jsx";
import BackButton from "../components/BackButton.jsx";

const Register = () => {
  const navigate = useNavigate();
  const { register: registerAccount, status, error, isAuthenticated, isAdmin } =
    useAuth();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isAdmin) {
      navigate("/admin", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.username || !form.email || !form.password) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      await registerAccount(form);
      toast.success("Tạo tài khoản thành công.");
    } catch (err) {
      const message =
        err?.message || "Không thể tạo tài khoản. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  const perks = useMemo(
    () => [
      {
        title: "Đồng bộ mọi thiết bị",
        detail: "Giỏ hàng, danh sách yêu thích và lịch sử mua sắm tự động cập nhật.",
      },
      {
        title: "Chăm sóc khách hàng ưu tiên",
        detail: "Kênh hỗ trợ riêng cùng chuyên gia tư vấn 24/7.",
      },
      {
        title: "Ưu đãi thành viên",
        detail: "Tích điểm đổi voucher và săn các chương trình giới hạn.",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-8">
        <BackButton
          fallback="/"
          variant="dark"
          iconSize={14}
          alwaysVisible
          className="mb-6 border-white/10 bg-white/5 text-white hover:bg-white/10"
        />
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="order-2 space-y-6 lg:order-1">
            <p className="inline-flex items-center rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.25em] text-slate-200">
              Thành viên Cellphone Shop
            </p>
            <div>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Tạo tài khoản <span className="text-brand-primary">trong 1 phút</span>
              </h1>
              <p className="mt-4 text-base text-slate-300 sm:text-lg">
                Gia nhập cộng đồng yêu công nghệ để nhận ưu đãi độc quyền và kiểm soát
                mọi đơn hàng của bạn dễ dàng hơn bao giờ hết.
              </p>
            </div>
            <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:grid-cols-2">
              {perks.map((perk) => (
                <div
                  key={perk.title}
                  className="rounded-2xl border border-white/5 bg-white/5 p-5"
                >
                  <p className="text-base font-semibold text-white">
                    {perk.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{perk.detail}</p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 backdrop-blur">
              <p className="font-semibold text-white">Cam kết an toàn dữ liệu</p>
              <p className="mt-2">
                Thông tin cá nhân được mã hóa và tuân thủ nghiêm ngặt các tiêu chuẩn
                bảo mật. Bạn có thể yêu cầu tải xuống hoặc xóa dữ liệu bất cứ lúc nào.
              </p>
            </div>
          </section>

          <section className="order-1 rounded-3xl border border-white/5 bg-white/95 p-8 text-slate-900 shadow-2xl shadow-brand-primary/20 lg:order-2">
            <div className="mb-8 space-y-2 text-center">
              <h2 className="text-2xl font-semibold text-slate-900">
                Đăng ký tài khoản
              </h2>
              <p className="text-sm text-slate-500">
                Điền thông tin bên dưới để tạo tài khoản mua sắm của bạn.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-slate-600"
                  >
                    Họ và tên
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                        required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="text-sm font-medium text-slate-600"
                  >
                    Tên đăng nhập
                  </label>
                  <input
                    id="username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="tentaikhoan"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-600"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="tentaikhoan@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-600"
                >
                  Mật khẩu
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Ít nhất 6 ký tự"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand-dark/50"
              >
                {status === "loading" ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Bạn đã có tài khoản?{" "}
              <Link
                to="/login"
                className="font-semibold text-brand-primary hover:text-brand-dark"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Register;
