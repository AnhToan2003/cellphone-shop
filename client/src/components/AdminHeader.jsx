import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { HiOutlineMenu } from "react-icons/hi";
import { FiLogOut, FiExternalLink } from "react-icons/fi";

import { useAuth } from "../context/AuthContext.jsx";

const AdminHeader = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const displayName = "NgocTrietStore";
  const displayEmail = user?.email && !user.email.includes("cellphoneshop") ? user.email : "admin@ngoctrietstore.vn";

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/95 px-4 sm:px-6 backdrop-blur-md shadow-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-100 hover:border-blue-500/60 hover:text-blue-400 lg:hidden transition"
          aria-label="Mở thanh điều hướng"
        >
          <HiOutlineMenu size={20} />
        </button>

        <Link to="/admin" className="flex items-center gap-3 group">
          <div className="relative">
            <img
              src="/logo.jpg"
              alt="Ngọc Triết Store Logo"
              className="h-10 w-10 rounded-full border border-blue-500/40 object-cover shadow-sm transition group-hover:scale-105"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold text-white tracking-wide group-hover:text-blue-400 transition">
              Ngọc Triết Store
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">
              Quản Trị Hệ Thống
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-blue-500/60 hover:bg-slate-800 hover:text-white"
          title="Mở giao diện khách hàng"
        >
          <span>Xem cửa hàng</span>
          <FiExternalLink size={13} />
        </Link>

        <div className="hidden flex-col text-right text-sm text-slate-300 sm:flex">
          <span className="font-semibold text-white">{displayName}</span>
          <span className="text-xs text-slate-400">{displayEmail}</span>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 hover:border-rose-500/60 hover:text-white"
        >
          <FiLogOut size={15} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
};

AdminHeader.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
};

export default AdminHeader;
