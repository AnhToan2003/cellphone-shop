import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import {
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlinePhotograph,
  HiOutlineUserGroup,
  HiOutlineCollection,
  HiOutlineTag,
} from "react-icons/hi";
import { TbDeviceMobile } from "react-icons/tb";
import { IoClose } from "react-icons/io5";
import { LuNetwork } from "react-icons/lu";
import { BsGift } from "react-icons/bs";
import { FiShield } from "react-icons/fi";

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
    to: "/admin/user-rankings",
    label: "Hạng khách hàng",
    icon: LuNetwork,
  },
  {
    to: "/admin/products",
    label: "Quản lý sản phẩm",
    icon: TbDeviceMobile,
  },
  {
    to: "/admin/categories",
    label: "Quản lý danh mục",
    icon: HiOutlineCollection,
  },
  {
    to: "/admin/orders",
    label: "Quản lý đơn hàng",
    icon: HiOutlineClipboardList,
  },
  {
    to: "/admin/warranty",
    label: "Quản lý bảo hành",
    icon: FiShield,
  },
  {
    to: "/admin/promotions",
    label: "Quản lý khuyến mãi",
    icon: BsGift,
  },
  {
    to: "/admin/brands",
    label: "Thương hiệu",
    icon: HiOutlineTag,
  },
  {
    to: "/admin/banners",
    label: "Quản lý banner & Nổi bật",
    icon: HiOutlinePhotograph,
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
      <nav className="mt-6 space-y-1.5 text-sm font-medium">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={Boolean(link.exact)}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 border",
                  isActive
                    ? "border-blue-500/40 bg-blue-600/15 text-blue-400 font-semibold shadow-sm shadow-blue-500/10"
                    : "border-transparent text-slate-300 hover:border-slate-800 hover:bg-slate-900/90 hover:text-white",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={19}
                    className={`transition-colors ${
                      isActive
                        ? "text-blue-400"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
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
