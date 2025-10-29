import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import LoginForm from "../components/LoginForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (isAdmin) {
      navigate("/admin", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950/80 p-10 shadow-2xl backdrop-blur">
        <h2 className="text-center text-2xl font-semibold text-white">
          Đăng nhập để tiếp tục
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Sử dụng email hoặc tên đăng nhập đã đăng ký cùng mật khẩu để truy cập ưu đãi độc quyền và quản lý đơn hàng của bạn.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
