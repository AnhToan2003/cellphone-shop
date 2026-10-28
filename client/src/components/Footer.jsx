import { Link } from "react-router-dom";
import { FiShield, FiCheckCircle, FiTruck } from "react-icons/fi";

const SERVICE_HIGHLIGHTS = [
  {
    title: "100% CHÍNH HÃNG APPLE",
    subtitle: "Thiết bị & phụ kiện chuẩn chất lượng",
    icon: <FiShield className="text-white" size={20} />,
  },
  {
    title: "BẢO HÀNH 1 ĐỔI 1",
    subtitle: "Kỹ thuật hỗ trợ chuyên nghiệp, an tâm",
    icon: <FiCheckCircle className="text-white" size={20} />,
  },
  {
    title: "GIAO HÀNG TOÀN QUỐC",
    subtitle: "Được kiểm tra máy trước khi nhận",
    icon: <FiTruck className="text-white" size={20} />,
  },
];

const APPLE_LINKS = [
  { label: "iPhone", to: "/products?category=iPhone" },
  { label: "iPad", to: "/products?category=iPad" },
  { label: "MacBook & Mac", to: "/products?category=Mac" },
  { label: "Apple Watch", to: "/products?category=Apple Watch" },
  { label: "Phụ kiện Apple", to: "/products?category=Phụ kiện" },
];

const POLICY_ITEMS = [
  { label: "Chính sách bảo hành", to: "/warranty" },
  { label: "Về Ngọc Triết Store", to: "/about" },
  { label: "Câu hỏi thường gặp", to: "/faq" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-slate-950 text-slate-300 border-t border-white/10">
      {/* Service Highlights Bar */}
      <div className="border-b border-white/10 bg-slate-900/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid gap-4 sm:grid-cols-3">
          {SERVICE_HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-sm transition hover:border-white/10 hover:bg-white/10"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/10">
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-wider">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {/* Brand Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Ngọc Triết Store"
              className="h-11 w-11 rounded-full border border-white/20 object-cover shadow"
            />
            <div>
              <h3 className="font-display text-base font-bold text-white tracking-tight">
                NgocTrietStore
              </h3>
              <p className="text-xs text-slate-400 font-medium">Chuyên Thiết Bị & Phụ Kiện Apple</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            Cửa hàng chuyên kinh doanh, tư vấn và sửa chữa thiết bị Apple chính hãng: iPhone, iPad, MacBook, Apple Watch và phụ kiện cao cấp.
          </p>
        </div>

        {/* Apple Ecosystem Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/10 pb-3">
            Sản phẩm Apple
          </h4>
          <ul className="mt-4 space-y-2 text-xs text-slate-400">
            {APPLE_LINKS.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="transition hover:text-white flex items-center gap-1.5">
                  <span className="text-slate-500">›</span> {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Policies & Support */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/10 pb-3">
            Chính sách & Hỗ trợ
          </h4>
          <ul className="mt-4 space-y-2 text-xs text-slate-400">
            {POLICY_ITEMS.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="transition hover:text-white flex items-center gap-1.5">
                  <span className="text-slate-500">›</span> {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10 bg-black/60 py-5 text-center text-xs text-slate-500">
        © {year} <span className="font-semibold text-slate-400">NgocTrietStore</span>. Chuyên Thiết Bị & Phụ Kiện Apple. Mọi quyền được bảo lưu.
      </div>
    </footer>
  );
}
