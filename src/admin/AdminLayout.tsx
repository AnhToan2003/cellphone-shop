import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "./admin.css";

type NavLinkItem = {
  label: string;
  to: string;
};

const links: NavLinkItem[] = [
  { label: "Th\u1ed1ng k\u00ea doanh thu", to: "/admin" },
  { label: "Qu\u1ea3n l\u00fd ng\u01b0\u1eddi d\u00f9ng \u0111\u0103ng nh\u1eadp", to: "/admin/users" },
  { label: "Qu\u1ea3n l\u00fd s\u1ea3n ph\u1ea9m", to: "/admin/products" },
  { label: "Ho\u1ea1t \u0111\u1ed9ng API", to: "/admin/api-activity" },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div
      className="admin-root"
      data-sidebar-open={sidebarOpen ? "true" : "false"}
    >
      <aside className="admin-sidebar">
        <button type="button" data-role="close" onClick={handleCloseSidebar}>
          {"\u0110\u00f3ng"}
        </button>
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={handleCloseSidebar}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <button
              type="button"
              data-variant="menu"
              onClick={handleToggleSidebar}
            >
              Menu
            </button>
            <span>Admin</span>
          </div>
          <div>
            <span>{user?.email ?? ""}</span>
            <button
              type="button"
              data-variant="logout"
              onClick={handleLogout}
            >
              {"\u0110\u0103ng xu\u1ea5t"}
            </button>
          </div>
        </header>
        <div style={{ flex: 1, padding: "24px" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
