import { useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";

const LoginForm = () => {
  const { login, status, error } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [formError, setFormError] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    try {
      await login(form);
    } catch (err) {
      const message = typeof err === "string" ? err : err?.message;
      setFormError(message || "Đăng nhập thất bại");
    }
  };

  const isLoading = status === "loading";
  const submitError = formError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-600">
          Tài khoản
        </label>
        <input
          type="text"
          name="identifier"
          value={form.identifier}
          onChange={handleChange}
          required
          placeholder="admin@example.com hoặc Admin"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-600">
          Mật khẩu
        </label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>

      {submitError && (
        <p className="text-sm text-red-500">{submitError}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand-dark/60"
      >
        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
};

export default LoginForm;
