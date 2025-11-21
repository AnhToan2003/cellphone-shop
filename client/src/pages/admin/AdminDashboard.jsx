import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from "recharts";

import {
  fetchAdminOverview,
  fetchLatestProducts,
} from "../../services/api.js";
import { getAssetUrl } from "../../utils/assets.js";

const METHOD_LABELS = {
  vietqr: "Chuyển khoản VietQR",
  cod: "Thanh toán khi nhận hàng (COD)",
};

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const formatInteger = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    paymentBreakdown: {
      cod: { revenue: 0, orders: 0, profit: 0 },
      vietqr: { revenue: 0, orders: 0, profit: 0 },
    },
    revenueTimeline: [],
    timelineRange: null,
    topProducts: [],
  });
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, productsRes] = await Promise.all([
          fetchAdminOverview(),
          fetchLatestProducts(5),
        ]);
        const overview = overviewRes.data?.data ?? {};
        setStats((prev) => ({
          ...prev,
          ...overview,
          paymentBreakdown: overview.paymentBreakdown ?? prev.paymentBreakdown,
          revenueTimeline: overview.revenueTimeline ?? [],
          topProducts: overview.topProducts ?? [],
          timelineRange: overview.timelineRange ?? null,
        }));
        setLatestProducts(productsRes.data?.data ?? []);
      } catch (error) {
        toast.error("Không thể tải dữ liệu bảng thống kê.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const paymentOverview = useMemo(() => {
    const breakdown = stats.paymentBreakdown ?? {};
    return Object.keys(METHOD_LABELS).map((key) => ({
      key,
      label: METHOD_LABELS[key],
      revenue: breakdown[key]?.revenue ?? 0,
      orders: breakdown[key]?.orders ?? 0,
      profit: breakdown[key]?.profit ?? 0,
    }));
  }, [stats.paymentBreakdown]);

  const timelineData = useMemo(() => {
    const series = stats.revenueTimeline ?? [];
    return series.map((entry) => {
      const cod = entry.cod || {};
      const vietqr = entry.vietqr || {};
      const totalRevenue = (cod.revenue ?? 0) + (vietqr.revenue ?? 0);
      const totalProfit = (cod.profit ?? 0) + (vietqr.profit ?? 0);

      return {
        date: new Date(entry.date).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        codRevenue: cod.revenue ?? 0,
        vietqrRevenue: vietqr.revenue ?? 0,
        totalRevenue,
        totalProfit,
      };
    });
  }, [stats.revenueTimeline]);

  const stackedRevenueData = useMemo(
    () =>
      timelineData.map((point) => ({
        date: point.date,
        cod: point.codRevenue ?? 0,
        vietqr: point.vietqrRevenue ?? 0,
      })),
    [timelineData]
  );

  const topProductData = useMemo(
    () =>
      (stats.topProducts ?? []).map((item) => ({
        name: item.name || "Sản phẩm",
        value: item.totalQuantity ?? 0,
        revenue: item.saleRevenue ?? item.totalRevenue ?? 0,
        listedRevenue: item.listedRevenue ?? 0,
        profit: item.totalProfit ?? 0,
      })),
    [stats.topProducts]
  );

  const summaryCards = [
    {
      label: "Tổng doanh thu",
      value: loading ? "..." : formatCurrency(stats.totalRevenue),
      highlight: "text-rose-400",
    },
    {
      label: "Tổng lợi nhuận",
      value: loading ? "..." : formatCurrency(stats.totalProfit),
      highlight: "text-emerald-400",
    },
    {
      label: "Biên lợi nhuận",
      value: loading
        ? "..."
        : stats.totalRevenue > 0
        ? `${((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)}%`
        : "0%",
      highlight: "text-purple-400",
    },
    {
      label: "Tổng số đơn",
      value: loading ? "..." : formatInteger(stats.totalOrders),
      highlight: "text-amber-400",
    },
    {
      label: "Sản phẩm đang bán",
      value: loading ? "..." : formatInteger(stats.totalProducts),
      highlight: "text-sky-400",
    },
  ];

  return (
    <div className="space-y-10 pt-4 lg:pt-12">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
          Tổng quan
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Tóm tắt doanh thu & lợi nhuận
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Theo dõi hiệu quả từng phương thức thanh toán, biên lợi nhuận và các
          sản phẩm nổi bật mới nhất trong cửa hàng.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/50"
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {card.label}
            </p>
            <p className={`mt-4 text-3xl font-semibold ${card.highlight}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/50">
        <h2 className="text-xl font-semibold text-white">
          Doanh thu theo phương thức thanh toán
        </h2>
        <p className="text-sm text-slate-400">
          So sánh doanh thu, số đơn và lợi nhuận của từng phương thức thanh toán.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paymentOverview.map((method) => (
            <div
              key={method.key}
              className="rounded-xl border border-slate-800 bg-slate-900/70 px-5 py-4"
            >
              <p className="text-xs uppercase tracking-widest text-slate-500">
                {method.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {loading ? "..." : formatCurrency(method.revenue)}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Đơn hàng</span>
                <span className="font-medium text-slate-200">
                  {loading ? "..." : formatInteger(method.orders)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>Lợi nhuận</span>
                <span className="font-medium text-emerald-300">
                  {loading ? "..." : formatCurrency(method.profit)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/50">
          <h2 className="text-xl font-semibold text-white">
            Doanh thu & lợi nhuận theo thời gian
          </h2>
          <p className="text-sm text-slate-400">
            Các cột hiển thị doanh thu COD và VietQR theo ngày; đường biểu diễn thể hiện lợi nhuận.
          </p>

          <div className="mt-6 h-[420px]">
            {timelineData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                {loading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu doanh thu."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={timelineData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis
                    yAxisId="left"
                    stroke="#94a3b8"
                    tickFormatter={formatCurrency}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#94a3b8"
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value ?? 0)}
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="codRevenue"
                    name="Doanh thu COD"
                    fill="#f97316"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="vietqrRevenue"
                    name="Doanh thu VietQR"
                    fill="#22c55e"
                    radius={[8, 8, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalProfit"
                    name="Lợi nhuận"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ stroke: "#38bdf8", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/50">
          <h2 className="text-xl font-semibold text-white">
            Tỷ trọng số lượng & lợi nhuận
          </h2>
          <p className="text-sm text-slate-400">
            Hiển thị mức đóng góp của các sản phẩm bán chạy vào sản lượng và
            lợi nhuận.
          </p>

          <div className="mt-6 h-[420px]">
            {topProductData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                {loading ? "Đang tải dữ liệu..." : "Chưa có thống kê sản phẩm."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProductData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={80}
                    outerRadius={150}
                    paddingAngle={3}
                    stroke="#0f172a"
                    strokeWidth={2}
                  >
                    {topProductData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={["#22c55e", "#0ea5e9", "#f97316", "#a855f7", "#f973ab"][index % 5]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${formatInteger(value)} sản phẩm`,
                      "Số lượng",
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return `${label} - Doanh thu: ${formatCurrency(
                        item?.revenue ?? 0
                      )} - Giá niêm yết: ${formatCurrency(
                        item?.listedRevenue ?? 0
                      )} - Lợi nhuận: ${formatCurrency(item?.profit ?? 0)}`;
                    }}
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value) => (
                      <span className="text-sm text-slate-200">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/50">
        <h2 className="text-xl font-semibold text-white">
          Sản phẩm mới nhất
        </h2>
        <p className="text-sm text-slate-400">
          Năm sản phẩm vừa được thêm vào danh mục.
        </p>

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
                      {product.brand || "Chưa rõ"}
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
                    Chưa có sản phẩm mới.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/50">
        <h2 className="text-xl font-semibold text-white">
          Phân rã doanh thu theo ngày
        </h2>
        <p className="text-sm text-slate-400">
          Biểu đồ cột thể hiện doanh thu COD và VietQR theo từng ngày.
        </p>

        <div className="mt-6 h-80">
          {stackedRevenueData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              {loading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu doanh thu."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stackedRevenueData}
                margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={formatCurrency} />
                <Tooltip
                  formatter={(value) => formatCurrency(value ?? 0)}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                    color: "#e2e8f0",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="cod"
                  name="COD"
                  stackId="revenue"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="vietqr"
                  name="VietQR"
                  stackId="revenue"
                  fill="#22c55e"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
