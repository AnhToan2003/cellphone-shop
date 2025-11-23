import { useEffect, useMemo, useState } from "react";

import ProductCard from "../components/ProductCard.jsx";
import { loadViewHistory, clearViewHistory } from "../utils/viewHistory.js";

const ViewHistory = () => {
  const [history, setHistory] = useState(() => loadViewHistory());

  useEffect(() => {
    setHistory(loadViewHistory());
  }, []);

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) => (b.lastViewed ?? 0) - (a.lastViewed ?? 0)
      ),
    [history]
  );

  const handleClear = () => {
    clearViewHistory();
    setHistory([]);
  };

  return (
    <div className="container-safe py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
            Đã xem
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Sản phẩm bạn đã xem gần đây
          </h1>
          <p className="text-sm text-slate-600">
            Lưu ý: lịch sử chỉ lưu trên thiết bị này và tối đa 30 sản phẩm gần nhất.
          </p>
        </div>
        {history.length ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-brand-primary hover:text-brand-primary"
          >
            Xóa lịch sử
          </button>
        ) : null}
      </div>

      {sortedHistory.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedHistory.map((product, index) => (
            <div
              key={product.slug || product._id || index}
              className={`motion-card motion-delay-${(index % 6) + 1}`}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Chưa có sản phẩm nào trong lịch sử. Hãy xem chi tiết sản phẩm để lưu lại tại đây.
        </div>
      )}
    </div>
  );
};

export default ViewHistory;
