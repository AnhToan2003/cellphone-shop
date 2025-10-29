import React, { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import "./admin.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <div className="admin-root">
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <Link to="/admin" onClick={() => setOpen(false)}>
          Thống kê doanh thu
        </Link>
        <Link to="/admin/users" onClick={() => setOpen(false)}>
          Quản lý người dùng đăng nhập
        </Link>
        <Link to="/admin/products" onClick={() => setOpen(false)}>
          Quản lý sản phẩm
        </Link>
      </aside>
      <section className="admin-main">
        <header className="admin-header">
          <button onClick={() => setOpen((v) => !v)}>☰</button>
          <div>Admin</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>{user?.email}</span>
            <button onClick={logout}>Đăng xuất</button>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
