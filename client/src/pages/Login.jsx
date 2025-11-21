import { useEffect, useMemo } from "react";
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

  const highlights = useMemo(
    () => [
      {
        title: "Bảo mật tuyệt đối",
        description:
          "Mã hóa hai lớp và cảnh báo đăng nhập giúp tài khoản của bạn luôn an toàn.",
      },
      {
        title: "Theo dõi đơn hàng dễ dàng",
        description:
          "Kiểm tra trạng thái, lịch sử và bảo hành chỉ trong một bảng điều khiển.",
      },
      {
        title: "Ưu đãi dành riêng",
        description:
          "Nhận thông báo flash sale và voucher thành viên sớm hơn mọi người.",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-16 pt-8 sm:px-8">
        <BackButton
          fallback="/"
          variant="dark"
          iconSize={14}
          alwaysVisible
          wrapperClassName="mb-6"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        />
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <p className="inline-flex items-center rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.25em] text-slate-200">
              Cellphone Shop
            </p>
            <div>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Quản lý tài khoản <br className="hidden md:block" />
                <span className="text-brand-primary">mượt mà hơn</span>
              </h1>
              <p className="mt-4 text-base text-slate-300 sm:text-lg">
                Đăng nhập để tiếp tục mua sắm, đồng bộ danh sách yêu thích và
                kiểm soát mọi đơn hàng của bạn ở cùng một nơi.
              </p>
            </div>
            <ul className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              {highlights.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary">
                    ●
                  </span>
                  <div>
                    <p className="text-base font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-300">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-300">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-semibold text-white underline decoration-brand-primary decoration-2 underline-offset-4 transition hover:text-brand-primary"
              >
                Đăng ký ngay
              </Link>
            </p>
          </section>

          <section className="relative rounded-3xl border border-white/5 bg-white/95 p-8 text-slate-900 shadow-2xl shadow-brand-primary/20">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-6 bottom-10 h-24 w-24 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="relative">
              <div className="mb-8 space-y-2 text-center">
                <h2 className="text-2xl font-semibold text-slate-900">
                  Đăng nhập để tiếp tục
                </h2>
                <p className="text-sm text-slate-500">
                  Sử dụng email hoặc tên đăng nhập đã tạo để truy cập tài khoản.
                </p>
              </div>
              <LoginForm />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;
