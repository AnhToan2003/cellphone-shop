import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import ProductCard from "../components/ProductCard.jsx";
import { clearFavorites } from "../store/slices/favoritesSlice.js";

const Favorites = () => {
  const dispatch = useDispatch();
  const favorites = useSelector((state) => state.favorites.items);

  const items = useMemo(() => favorites ?? [], [favorites]);

  if (!items.length) {
    return (
      <section className="py-16">
        <div className="container-safe text-center">
          <h1 className="text-3xl font-semibold text-slate-900">
            Chưa có sản phẩm yêu thích
          </h1>
          <p className="mt-4 text-sm text-slate-500">
            Hãy thêm sản phẩm vào danh sách yêu thích để xem lại nhanh tại đây.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container-safe space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
              Danh sách yêu thích
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Sản phẩm bạn đã lưu
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Nhấn vào biểu tượng trái tim để thêm hoặc bỏ sản phẩm khỏi danh
              sách này.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(clearFavorites())}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-400 hover:text-red-500"
          >
            Xóa toàn bộ
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Favorites;
