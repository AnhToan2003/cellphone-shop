import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-safe py-28 text-center">
      <span className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
        404 Lỗi
      </span>
      <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
        Không tìm thấy trang
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
        Trang bạn đang tìm kiếm có thể đã được chuyển hoặc không còn tồn tại trên hệ thống Ngọc Triết Store.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/"
          className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow transition hover:bg-blue-600"
        >
          Về trang chủ
        </Link>
        <Link
          to="/products"
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Xem sản phẩm
        </Link>
      </div>
    </div>
  );
}
