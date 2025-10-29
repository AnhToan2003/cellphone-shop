import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import {
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlinePhotograph,
  HiOutlineUserGroup,
} from "react-icons/hi";
import { TbDeviceMobile } from "react-icons/tb";
import { IoClose } from "react-icons/io5";
import { LuNetwork } from "react-icons/lu";
import { BsGift } from "react-icons/bs";

const links = [
  {
    to: "/admin",
    label: "Thống kê doanh thu",
    icon: HiOutlineChartBar,
    exact: true,
  },
  {
    to: "/admin/users",
    label: "Quản lý người dùng",
    icon: HiOutlineUserGroup,
  },
  {
    to: "/admin/products",
    label: "Quản lý sản phẩm",
    icon: TbDeviceMobile,
  },
  {
    to: "/admin/orders",
    label: "Quản lý đơn hàng",
    icon: HiOutlineClipboardList,
  },
  {
    to: "/admin/promotions",
    label: "Khuyến mãi",
    icon: BsGift,
  },
  {
    to: "/admin/banners",
    label: "Chỉnh sửa banner",
    icon: HiOutlinePhotograph,
  },
  {
    to: "/admin/api-activity",
    label: "Hoạt động API",
    icon: LuNetwork,
  },
];

const AdminSidebar = ({ isOpen, onClose }) => (
  <>
    <div
      className={`fixed inset-y-0 left-0 z-30 flex w-60 transform flex-col border-r border-slate-800 bg-slate-950/95 px-4 py-6 pt-20 transition-transform duration-200 ease-in-out lg:pt-24 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-10 flex items-center justify-between lg:hidden">
        <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Điều hướng
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-white"
          aria-label="Đóng thanh điều hướng"
        >
          <IoClose size={18} />
        </button>
      </div>
      <nav className="mt-6 space-y-2 text-sm font-medium">
        {links.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={Boolean(exact)}
            onClick={onClose}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-xl px-4 py-3 transition",
                isActive
                  ? "bg-brand-primary/20 text-brand-primary"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              ].join(" ")
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
    {isOpen && (
      <div
        className="fixed inset-0 z-20 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
    )}
  </>
);

AdminSidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AdminSidebar;
