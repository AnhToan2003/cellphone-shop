import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAuth } from "../context/AuthContext.jsx";

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
    if (isAuthenticated) {
      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
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
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      await registerAccount(form);
      toast.success("Tạo tài khoản thành công");
    } catch (err) {
      const message =
        err?.message || "Không thể tạo tài khoản. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  return (
    <div className="container-safe flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="text-3xl font-bold text-slate-900">Đăng ký ngay</h1>
        <p className="mt-2 text-sm text-slate-500">
          Gia nhập Cellphone Shop để nhận ưu đãi độc quyền và theo dõi đơn hàng của bạn dễ dàng hơn.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-600"
            >
              Tên đăng nhập
            </label>
            <input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              placeholder="tentaikhoan"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-600"
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
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              placeholder="tentaikhoan@gmail.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-600"
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
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              placeholder="Nhập mật khẩu của bạn"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand-dark/50"
          >
            {status === "loading" ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Bạn đã có tài khoản? Đăng nhập ngay{" "}
          <Link
            to="/login"
            className="font-semibold text-brand-primary hover:text-brand-dark"
          >
            tại đây
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
