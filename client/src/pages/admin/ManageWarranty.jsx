import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { FiSearch, FiShield } from "react-icons/fi";

import { fetchAdminOrders } from "../../services/api.js";
import { normalizeText } from "../../utils/text.js";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

const addMonths = (date, months = 12) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const STATUS_META = {
  active: {
    label: "Còn hiệu lực",
    tone: "bg-emerald-200/20 text-emerald-300 border border-emerald-500/40",
  },
  expired: {
    label: "Đã hết hạn",
    tone: "bg-rose-200/10 text-rose-300 border border-rose-500/30",
  },
};

const ManageWarranty = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data } = await fetchAdminOrders();
      const orders = Array.isArray(data?.data) ? data.data : [];
      const now = new Date();
      const flattened = orders.flatMap((order) => {
        const reference =
          order.deliveredAt || order.updatedAt || order.createdAt || Date.now();
        const baseDate = new Date(reference);
        return (order.items || []).map((item, index) => {
          const monthsRaw =
            item.warrantyMonths ??
            item.product?.warrantyMonths ??
            order.warrantyMonths ??
            12;
          const months = Number.isFinite(Number(monthsRaw))
            ? Number(monthsRaw)
            : 12;
          const endDate = addMonths(baseDate, months);
          const status = endDate >= now ? "active" : "expired";
          const daysRemaining = Math.max(
            0,
            Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
          );
          return {
            id: `${order._id}-${index}`,
            productName: item.name,
            buyerName:
              order.user?.name ||
              order.shippingInfo?.fullName ||
              "Khách lẻ",
            buyerEmail: order.user?.email || order.shippingInfo?.email || "",
            orderCode: order.code || order._id?.slice(-6) || "Đơn hàng",
            startDate: baseDate,
            endDate,
            months,
            status,
            daysRemaining,
            policy:
              item.warrantyPolicy ||
              item.product?.warrantyPolicy ||
              "Theo chính sách chuẩn 12 tháng.",
          };
        });
      });
      setRecords(flattened);
    } catch (error) {
      toast.error("Không thể tải danh sách bảo hành.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const stats = useMemo(() => {
    const total = records.length;
    const active = records.filter((item) => item.status === "active").length;
    const expired = total - active;
    const expiringSoon = records.filter(
      (item) => item.status === "active" && item.daysRemaining <= 15
    ).length;
    return { total, active, expired, expiringSoon };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const keyword = normalizeText(query);
    return records.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter;
      const matchesQuery =
        !keyword ||
        normalizeText(item.productName).includes(keyword) ||
        normalizeText(item.buyerName).includes(keyword) ||
        normalizeText(item.orderCode).includes(keyword);
      return matchesStatus && matchesQuery;
    });
  }, [records, query, statusFilter]);

  return (
    <div className="space-y-8 font-sans">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
          Bảo hành
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Quản lý bảo hành sản phẩm
        </h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Theo dõi thời hạn bảo hành của từng đơn hàng, chủ động nhắc khách khi
          gần hết hạn và xem nhanh chính sách áp dụng cho iPhone 17 cùng các
          sản phẩm khác.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng thiết bị", value: stats.total },
          { label: "Còn hiệu lực", value: stats.active },
          { label: "Đã hết hạn", value: stats.expired },
          { label: "Sắp hết hạn (≤15 ngày)", value: stats.expiringSoon },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <FiShield />
              Danh sách bảo hành
            </h2>
            <p className="text-sm text-slate-400">
              Bạn có thể lọc theo trạng thái hoặc tìm nhanh theo tên sản phẩm,
              khách hàng.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {["all", "active", "expired"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  statusFilter === status
                    ? "bg-brand-primary/20 text-brand-primary"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {status === "all"
                  ? "Tất cả"
                  : status === "active"
                  ? "Còn hạn"
                  : "Hết hạn"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-slate-700 bg-slate-950/40 px-4 py-2">
            <FiSearch className="text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm sản phẩm hoặc khách hàng..."
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={loadOrders}
            className="rounded-full border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-200"
          >
            Làm mới
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Hiệu lực</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3">Ghi chú</th>
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
                      <div className="h-4 w-1/2 rounded bg-slate-800" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 rounded bg-slate-800" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="mx-auto h-6 w-24 rounded-full bg-slate-800" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-3/4 rounded bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : filteredRecords.length ? (
                filteredRecords.map((item) => {
                  const meta = STATUS_META[item.status] || STATUS_META.active;
                  return (
                    <tr key={item.id} className="hover:bg-slate-900/40">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          Đơn #{item.orderCode} • {item.months} tháng
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-white">
                          {item.buyerName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.buyerEmail || "Không cung cấp"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        <p>
                          Từ {formatDate(item.startDate)} đến{" "}
                          {formatDate(item.endDate)}
                        </p>
                        {item.status === "active" ? (
                          <p className="text-xs text-emerald-300">
                            Còn {item.daysRemaining} ngày
                          </p>
                        ) : (
                          <p className="text-xs text-rose-300">
                            Hết hạn {formatDate(item.endDate)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex min-w-[120px] justify-center rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {item.policy}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Không tìm thấy thiết bị nào khớp tiêu chí.
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

export default ManageWarranty;
