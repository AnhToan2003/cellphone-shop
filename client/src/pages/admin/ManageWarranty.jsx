import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FiCheckCircle,
  FiClock,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiXCircle,
} from "react-icons/fi";

import { fetchAdminOrders } from "../../services/api.js";
import { normalizeText } from "../../utils/text.js";
import { getAssetUrl } from "../../utils/assets.js";

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
    tone: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  },
  expired: {
    label: "Đã hết hạn",
    tone: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
  },
};

const ManageWarranty = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data } = await fetchAdminOrders();
      const orders = Array.isArray(data?.data) ? data.data : [];
      const now = new Date();
      const flattened = orders.flatMap((order) => {
        if (order.status === "cancelled") return [];

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
            color: item.color || "",
            capacity: item.capacity || "",
            image: item.image || item.product?.imageUrl || item.product?.images?.[0] || "",
            buyerName:
              order.shippingInfo?.fullName ||
              order.user?.name ||
              "Khách lẻ",
            buyerPhone: order.shippingInfo?.phone || order.user?.phone || "",
            buyerEmail: order.user?.email || order.shippingInfo?.email || "",
            orderCode: order.code || order._id?.slice(-8).toUpperCase() || "Đơn hàng",
            paymentMethod: order.paymentMethod || "cod",
            startDate: baseDate,
            endDate,
            months,
            status,
            daysRemaining,
            policy:
              item.warrantyPolicy ||
              item.product?.warrantyPolicy ||
              "Lỗi 1 đổi 1 trong 30 ngày, bảo hành 12 tháng tại Ngọc Triết Store.",
          };
        });
      });
      setRecords(flattened);
    } catch {
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
    const keyword = normalizeText(query.trim());
    const cleanPhoneQuery = query.replace(/\D/g, "");

    return records.filter((item) => {
      // 1. Status Filter
      if (statusFilter === "active" && item.status !== "active") return false;
      if (statusFilter === "expired" && item.status !== "expired") return false;
      if (statusFilter === "expiringSoon" && (item.status !== "active" || item.daysRemaining > 15)) return false;

      // 2. Query Search (by phone, customer name, orderCode, productName)
      if (keyword) {
        const itemCleanPhone = (item.buyerPhone || "").replace(/\D/g, "");
        const matchesPhone = cleanPhoneQuery && itemCleanPhone.includes(cleanPhoneQuery);
        const matchesText =
          normalizeText(item.buyerPhone).includes(keyword) ||
          normalizeText(item.buyerName).includes(keyword) ||
          normalizeText(item.productName).includes(keyword) ||
          normalizeText(item.orderCode).includes(keyword);

        return matchesPhone || matchesText;
      }

      return true;
    });
  }, [records, query, statusFilter]);

  return (
    <div className="space-y-8 font-sans">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400 font-bold">
            Quản Trị Bảo Hành Điện Tử
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-white">
            Quản Lý Bảo Hành Theo Số Điện Thoại
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Tra cứu và quản lý toàn bộ thiết bị Apple bảo hành điện tử theo SĐT người mua tại Ngọc Triết Store.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition shadow-sm"
        >
          <FiRefreshCw className={loading ? "animate-spin text-blue-400" : ""} />
          <span>Làm mới danh sách</span>
        </button>
      </header>

      {/* METRICS CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tổng thiết bị bảo hành
          </p>
          <p className="mt-3 text-3xl font-extrabold text-white">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-500">Kích hoạt từ các đơn hàng đã mua</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Còn hiệu lực bảo hành
          </p>
          <p className="mt-3 text-3xl font-extrabold text-emerald-300">{stats.active}</p>
          <p className="mt-1 text-xs text-slate-400">Đang trong thời gian bảo hành Apple</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Sắp hết hạn (≤ 15 ngày)
          </p>
          <p className="mt-3 text-3xl font-extrabold text-amber-300">{stats.expiringSoon}</p>
          <p className="mt-1 text-xs text-slate-400">Cần chủ động nhắc khách kiểm tra máy</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-400">
            Đã hết hạn
          </p>
          <p className="mt-3 text-3xl font-extrabold text-rose-300">{stats.expired}</p>
          <p className="mt-1 text-xs text-slate-400">Vẫn hỗ trợ kỹ thuật trọn đời</p>
        </div>
      </div>

      {/* FILTER & PHONE SEARCH BAR */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <FiShield className="text-blue-400" />
              Tra Cứu &amp; Danh Sách Thiết Bị Bảo Hành
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Nhập Số Điện Thoại khách hàng để tra cứu ngay thiết bị cần bảo hành hoặc hỗ trợ kỹ thuật.
            </p>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === "all"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === "active"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-emerald-400"
              }`}
            >
              <FiCheckCircle size={13} />
              <span>Còn hạn ({stats.active})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("expiringSoon")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === "expiringSoon"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-amber-400"
              }`}
            >
              <FiClock size={13} />
              <span>Sắp hết ({stats.expiringSoon})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("expired")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === "expired"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-rose-400"
              }`}
            >
              <FiXCircle size={13} />
              <span>Hết hạn ({stats.expired})</span>
            </button>
          </div>
        </div>

        {/* Search input (Focused on Phone) */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Nhập số điện thoại khách hàng (Ví dụ: 0395554268), tên khách, tên sản phẩm..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>

        {/* WARRANTY TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-950/70">
              <tr className="text-left font-bold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3.5">Thiết bị &amp; Đơn hàng</th>
                <th className="px-4 py-3.5">Khách hàng &amp; Số điện thoại</th>
                <th className="px-4 py-3.5">Thời hạn bảo hành</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5">Chính sách cam kết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 text-slate-200">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={5} className="h-16 px-4 py-3 bg-slate-900/20" />
                  </tr>
                ))
              ) : filteredRecords.length ? (
                filteredRecords.map((item) => {
                  const meta = STATUS_META[item.status] || STATUS_META.active;
                  return (
                    <tr key={item.id} className="transition hover:bg-slate-800/40">
                      {/* Product Column */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              getAssetUrl(item.image) ||
                              "https://placehold.co/48x48?text=Apple"
                            }
                            alt={item.productName}
                            className="h-10 w-10 shrink-0 rounded-lg border border-slate-800 bg-slate-950 object-contain p-1"
                          />
                          <div>
                            <p className="font-bold text-white">{item.productName}</p>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              {item.color && (
                                <span className="rounded bg-slate-800 px-1.5 py-0.2 text-slate-300">
                                  {item.color}
                                </span>
                              )}
                              {item.capacity && (
                                <span className="rounded bg-slate-800 px-1.5 py-0.2 text-slate-300">
                                  {item.capacity}
                                </span>
                              )}
                              <span className="font-mono text-blue-400">#{item.orderCode}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer & Phone Column (PROMINENT) */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-white text-sm">{item.buyerName}</p>
                        <a
                          href={`tel:${item.buyerPhone}`}
                          className="mt-0.5 inline-flex items-center gap-1 font-mono font-bold text-blue-400 hover:underline"
                        >
                          <FiPhone size={12} />
                          <span>{item.buyerPhone || "Chưa có SĐT"}</span>
                        </a>
                        {item.buyerEmail && (
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[180px]">
                            {item.buyerEmail}
                          </p>
                        )}
                      </td>

                      {/* Warranty Schedule Column */}
                      <td className="px-4 py-3.5 text-slate-300">
                        <p>Kích hoạt: {formatDate(item.startDate)}</p>
                        <p className="font-semibold text-white">Hết hạn: {formatDate(item.endDate)}</p>
                        <p className="text-[11px] text-slate-500">Gói {item.months} tháng</p>
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border ${meta.tone}`}
                        >
                          <span>{meta.label}</span>
                          {item.status === "active" && (
                            <span className="text-[10px] opacity-80">
                              ({item.daysRemaining} ngày)
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Policy Column */}
                      <td className="px-4 py-3.5 text-slate-400 max-w-xs text-[11px] leading-relaxed">
                        {item.policy}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    {query ? (
                      <>Không tìm thấy thiết bị bảo hành nào cho từ khóa &quot;{query}&quot;.</>
                    ) : (
                      <>Chưa có thiết bị nào trong danh sách bảo hành.</>
                    )}
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
