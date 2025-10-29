import PropTypes from "prop-types";
import { HiOutlineMenu } from "react-icons/hi";
import { FiLogOut } from "react-icons/fi";

import { useAuth } from "../context/AuthContext.jsx";

const AdminHeader = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const displayName = user?.name || "Quản trị viên";
  const displayEmail = user?.email || "admin@cellphone-shop.local";

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-100 hover:border-brand-primary/60 hover:text-brand-primary lg:hidden"
          aria-label="Mở thanh điều hướng"
        >
          <HiOutlineMenu size={20} />
        </button>
        <div className="flex flex-col">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary">
            Trang quản lý
          </span>
          <span className="text-xs text-slate-500">ADMIN</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden flex-col text-right text-sm text-slate-300 sm:flex">
          <span className="font-semibold text-slate-100">{displayName}</span>
          <span className="text-xs text-slate-500">{displayEmail}</span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-full border border-brand-primary/60 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
        >
          <FiLogOut size={16} />
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
