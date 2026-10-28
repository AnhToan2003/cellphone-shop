import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

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
  const [showPassword, setShowPassword] = useState(false);

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
      toast.success("Tạo tài khoản thành công!");
    } catch (err) {
      const message =
        err?.message || "Không thể tạo tài khoản. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  const isLoading = status === "loading";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute -bottom-40 left-10 h-[400px] w-[400px] rounded-full bg-slate-800/20 blur-[100px]" />
      </div>

      {/* Floating Back Button */}
      <div className="absolute left-6 top-6 z-20">
        <BackButton
          fallback="/"
          variant="dark"
          iconSize={14}
          alwaysVisible
          className="border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur shadow-lg"
        />
      </div>

      {/* Centered Register Card */}
      <div className="relative z-10 w-full max-w-lg animate-fade-in-up">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center">
            <Link to="/" className="group mb-5 flex flex-col items-center">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black p-1 shadow-xl transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/logo.jpg"
                  alt="Ngọc Triết Store"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
            </Link>

            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Tạo tài khoản mới
            </h1>
            <p className="mt-1.5 text-xs text-slate-400">
              Trở thành thành viên Ngọc Triết Store để nhận đặc quyền bảo hành Apple
            </p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Họ và tên */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-medium text-slate-300">
                  Họ và tên
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <FiUser size={15} />
                  </span>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-3 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* Tên đăng nhập */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-xs font-medium text-slate-300">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <span className="text-xs font-bold">@</span>
                  </span>
                  <input
                    id="username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    placeholder="username"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-3 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-slate-300">
                Địa chỉ Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <FiMail size={16} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-slate-300">
                Mật khẩu (ít nhất 6 ký tự)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <FiLock size={16} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 transition"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition duration-200 hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang tạo tài khoản...
                </span>
              ) : (
                "Đăng ký tài khoản"
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-8 border-t border-slate-800/80 pt-6 text-center text-xs text-slate-400">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-bold text-blue-400 hover:text-blue-300 hover:underline transition ml-1"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-[11px] text-slate-500">
          © 2026 Ngọc Triết Store. Cam kết bảo mật thông tin tuyệt đối.
        </p>
      </div>
    </div>
  );
};

export default Register;
