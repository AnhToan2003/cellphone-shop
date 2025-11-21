const CONTACT_ITEMS = [
  { label: "Hotline", value: "0794 460 285" },
  { label: "Email", value: "support@cellphones.dev" },
  { label: "Thời gian", value: "08:00 - 21:00" },
];

const POLICY_ITEMS = ["Đổi trả 30 ngày", "Giao hàng toàn quốc", "Thanh toán COD/Online"];
const SOCIAL_ITEMS = ["Facebook", "Zalo", "YouTube", "TikTok"];
const SERVICE_HIGHLIGHTS = [
  { title: "GIAO NHANH 2H", subtitle: "TOÀN QUỐC" },
  { title: "TRẢ GÓP 0%", subtitle: "THAO TÁC ONLINE" },
  { title: "HỖ TRỢ 24/7", subtitle: "0794 460 285" },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <div className="container-safe grid gap-4 py-10 text-center uppercase tracking-[0.28em] text-white/85 sm:grid-cols-3">
        {SERVICE_HIGHLIGHTS.map((item) => (
          <div
            key={item.title}
            className="rounded-[32px] border border-white/25 bg-white/5 px-6 py-5 backdrop-blur"
          >
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-2 text-[11px] tracking-[0.35em] text-white/70">{item.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="container-safe grid gap-10 py-16 lg:grid-cols-4">
        <div className="space-y-4">
          <p className="pill-badge bg-white/10 text-white">Cellphone Shop</p>
          <h3 className="text-2xl font-semibold text-white">
            Công nghệ sống động, trải nghiệm đa kênh.
          </h3>
          <p className="text-sm text-white/70">
            Khám phá showroom trực tuyến với kho sản phẩm flagship, giao nhanh 2h và ưu đãi độc quyền chỉ có tại
            Cellphone Shop.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Hỗ trợ</h4>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            {CONTACT_ITEMS.map((item) => (
              <li key={item.label} className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                  {item.label}
                </span>
                <span className="text-base font-semibold text-white">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Chính sách</h4>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            {POLICY_ITEMS.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-white/10 px-4 py-2 text-white/70 transition hover:border-white/40 hover:text-white"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Kết nối</h4>
          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/80">
            {SOCIAL_ITEMS.map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 px-4 py-2 text-center">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-white/60">
        © {year} Cellphone Shop. Mọi quyền được bảo lưu.
      </div>
    </footer>
  );
};

export default Footer;
