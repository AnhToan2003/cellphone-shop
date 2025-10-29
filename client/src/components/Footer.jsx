const Footer = () => (
  <footer className="mt-16 bg-white text-sm text-slate-600">
    <div className="container-safe grid gap-8 py-12 md:grid-cols-4">
      <div>
        <h3 className="text-lg font-semibold text-brand-primary">
          Cellphone Shop
        </h3>
        <p className="mt-3 leading-relaxed text-slate-500">
          Trải nghiệm không gian mua sắm chuẩn Cellphone Shop với thiết bị chọn lọc, quy trình thanh toán nhanh chóng và giao diện hiện đại.
        </p>
      </div>
      <div>
        <h4 className="text-base font-semibold text-slate-900">
          Trung tâm hỗ trợ
        </h4>
        <ul className="mt-3 space-y-2">
          <li>Hotline: 0794460285</li>
          <li>Email: support@cellphones.dev</li>
          <li>Giờ làm việc: 08:00 - 21:00</li>
        </ul>
      </div>
      <div>
        <h4 className="text-base font-semibold text-slate-900">Chính sách</h4>
        <ul className="mt-3 space-y-2">
          <li>Đổi trả trong 30 ngày</li>
          <li>Giao hàng toàn quốc</li>
          <li>Thanh toán COD hoặc online</li>
        </ul>
      </div>
      <div>
        <h4 className="text-base font-semibold text-slate-900">
          Kết nối với chúng tôi
        </h4>
        <ul className="mt-3 space-y-2">
          <li>Facebook</li>
          <li>Zalo</li>
          <li>YouTube</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
      © {new Date().getFullYear()} Cellphone Shop. Hân hạnh được tài trợ.
    </div>
  </footer>
);

export default Footer;
