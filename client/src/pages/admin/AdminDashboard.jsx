import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import {
  fetchAdminOverview,
  fetchLatestProducts,
} from "../../services/api.js";
import { getAssetUrl } from "../../utils/assets.js";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value) =>
  new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value > 0 && value < 1 ? 1 : 0,
  }).format(value ?? 0);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    paymentBreakdown: {
      cod: { revenue: 0, orders: 0 },
      vietqr: { revenue: 0, orders: 0 },
    },
    revenueTimeline: [],
    timelineRange: null,
  });
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsResponse, productsResponse] = await Promise.all([
          fetchAdminOverview(),
          fetchLatestProducts(5),
        ]);

        const overviewData = statsResponse.data.data || {};

        setStats((previous) => ({
          ...previous,
          ...overviewData,
          paymentBreakdown: {
            ...(previous.paymentBreakdown || {}),
            ...(overviewData.paymentBreakdown || {}),
          },
          revenueTimeline:
            overviewData.revenueTimeline ?? previous.revenueTimeline ?? [],
          timelineRange:
            overviewData.timelineRange ?? previous.timelineRange ?? null,
        }));
        setLatestProducts(productsResponse.data.data || []);
      } catch (error) {
        toast.error("Không thể tải dữ liệu tổng quan");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const cards = [
    {
      label: "Doanh thu (ước tính)",
      value: stats.totalRevenue ?? 0,
      highlight: "text-rose-400",
      formatter: formatCurrency,
    },
    {
      label: "Tổng đơn hàng",
      value: stats.totalOrders ?? 0,
      highlight: "text-amber-400",
    },
    {
      label: "Sản phẩm đang bán",
      value: stats.totalProducts ?? 0,
      highlight: "text-sky-400",
    },
    {
      label: "Người dùng đã đăng ký",
      value: stats.totalUsers ?? 0,
      highlight: "text-emerald-400",
    },
  ];

  return (
    <div className="space-y-10 pt-4 lg:pt-12">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
          Tổng quan
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Thống kê doanh thu
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Theo dõi hiệu suất bán hàng, số lượng đơn và sản phẩm mới cập nhật để tối ưu vận hành cửa hàng.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/50"
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {card.label}
            </p>
            <p className={`mt-4 text-3xl font-semibold ${card.highlight}`}>
              {loading
                ? "..."
                : card.formatter
                ? card.formatter(card.value)
                : card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Sản phẩm mới cập nhật
            </h2>
            <p className="text-sm text-slate-400">
              Danh sách 5 sản phẩm vừa được thêm gần đây.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Thương hiệu</th>
                <th className="px-4 py-3 text-right">Giá bán</th>
                <th className="px-4 py-3 text-right">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 w-2/3 rounded bg-slate-800" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-1/3 rounded bg-slate-800" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="ml-auto h-4 w-16 rounded bg-slate-800" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="ml-auto h-4 w-24 rounded bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : latestProducts.length ? (
                latestProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-900/70">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            getAssetUrl(
                              product.imageUrl || product.images?.[0]
                            ) || "https://placehold.co/56x56?text=No+Image"
                          }
                          alt={product.name}
                          className="h-12 w-12 rounded-lg border border-slate-800 object-cover"
                        />
                        <div>
                          <p className="font-semibold text-white">
                            {product.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            #{product._id?.slice(-6)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {product.brand || "Không rõ"}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-100">
                      {formatCurrency(product.finalPrice ?? product.price ?? 0)}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-400">
                      {new Date(product.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Không tìm thấy sản phẩm gần đây.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
