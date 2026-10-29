import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import LoginForm from "../components/LoginForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import BackButton from "../components/BackButton.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isAdmin) {
      navigate("/admin", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute -bottom-40 right-10 h-[400px] w-[400px] rounded-full bg-slate-800/20 blur-[100px]" />
      </div>

      {/* Floating Back Button */}
      <div className="absolute left-4 top-4 sm:left-6 sm:top-6 z-20">
        <BackButton
          fallback="/"
          variant="dark"
          iconSize={14}
          alwaysVisible
          className="border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur shadow-lg"
        />
      </div>

      {/* Centered Login Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 sm:p-10 shadow-2xl backdrop-blur-2xl">
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
              Đăng nhập tài khoản
            </h1>
            <p className="mt-1.5 text-xs text-slate-400">
              Ngọc Triết Store • Apple Specialist
            </p>
          </div>

          {/* Form */}
          <div className="mt-8">
            <LoginForm />
          </div>

          {/* Switch to Register */}
          <div className="mt-8 border-t border-slate-800/80 pt-6 text-center text-xs text-slate-400">
            Chưa có tài khoản thành viên?{" "}
            <Link
              to="/register"
              className="font-bold text-blue-400 hover:text-blue-300 hover:underline transition ml-1"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-[11px] text-slate-500">
          © 2026 Ngọc Triết Store. Bảo mật chuẩn SSL 256-bit.
        </p>
      </div>
    </div>
  );
};

export default Login;
