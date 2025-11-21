import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiInfo, FiRefreshCw, FiShield } from "react-icons/fi";

import { useAuth } from "../context/AuthContext.jsx";
import { fetchMyWarrantyItems } from "../services/api.js";
import { getAssetUrl } from "../utils/assets.js";

const STATUS_META = {
  active: {
    label: "Còn hiệu lực",
    tone: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  expired: {
    label: "Đã hết hạn",
    tone: "bg-rose-100 text-rose-700 border border-rose-200",
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDate = (value) => {
  if (!value) return "Chưa cập nhật";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const basePolicyDetails = [
  "Tất cả thiết bị được bảo hành tiêu chuẩn 12 tháng kể từ ngày mua.",
  "Áp dụng đổi mới trong 10 ngày nếu phát sinh lỗi phần cứng do nhà sản xuất.",
  "Không áp dụng khi sản phẩm bị rơi, va đập, vào nước hoặc đã tự ý sửa chữa.",
  "Vui lòng mang hóa đơn và thông tin sản phẩm khi tới trung tâm bảo hành.",
  "Một số dòng cao cấp (ví dụ iPhone 17 series) yêu cầu giữ nguyên seal để được đổi mới trong 15 ngày đầu.",
];

const normalizeWarrantyItem = (item, index = 0) => {
  if (!item || typeof item !== "object") return null;
  const orderId = item.orderId || "";
  const productId = item.productId || item.productSlug || index;
  const startDate = item.activatedAt || item.startDate || null;
  const endDate = item.expiresAt || item.endDate || null;
  return {
    id: `${orderId}-${productId}-${index}`,
    productName: item.productName || item.name || "Sản phẩm",
    productBrand: item.productBrand || item.brand || "",
    orderId,
    orderCode: item.orderCode || orderId?.slice?.(-6) || "N/A",
    productSlug: item.productSlug || item.slug || "",
    image:
      item.image ||
      item.imageUrl ||
      item.product?.images?.[0] ||
      item.product?.image ||
      "",
    status: item.status || "active",
    warrantyPolicy: item.warrantyPolicy || item.policy || "",
    warrantyMonths: item.warrantyMonths || item.months || 12,
    quantity: item.quantity || 1,
    price: item.price ?? null,
    startDate,
    endDate,
  };
};

const WarrantyPolicy = () => {
  const { isAuthenticated } = useAuth();
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    expired: 0,
    items: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!isAuthenticated) {
      setSummary({ total: 0, active: 0, expired: 0, items: [] });
      return;
    }

    const loadWarranty = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await fetchMyWarrantyItems();
        const payload = data?.data;

        const normalizedItems = Array.isArray(payload?.items)
          ? payload.items
              .map((item, index) => normalizeWarrantyItem(item, index))
              .filter(Boolean)
          : [];

        const derivedCounts = normalizedItems.reduce(
          (acc, item) => {
            if (item.status === "active") acc.active += 1;
            if (item.status === "expired") acc.expired += 1;
            return acc;
          },
          { active: 0, expired: 0 }
        );

        setSummary({
          total: payload?.total ?? normalizedItems.length,
          active: payload?.active ?? derivedCounts.active,
          expired: payload?.expired ?? derivedCounts.expired,
          items: normalizedItems,
        });
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Không thể tải thông tin bảo hành. Vui lòng thử lại sau."
        );
        setSummary({ total: 0, active: 0, expired: 0, items: [] });
      } finally {
        setLoading(false);
      }
    };

    loadWarranty();
  }, [isAuthenticated]);

  const filteredItems = useMemo(() => {
    if (!Array.isArray(summary.items)) return [];
    if (filter === "active") {
      return summary.items.filter((item) => item.status === "active");
    }
    if (filter === "expired") {
      return summary.items.filter((item) => item.status === "expired");
    }
    return summary.items;
  }, [summary.items, filter]);

  return (
    <div className="container-safe py-12 font-sans">
      <div className="mb-10 rounded-3xl bg-white p-8 shadow-card">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <FiShield size={28} />
          </div>
          <div className="min-w-[240px] flex-1">
            <h1 className="text-3xl font-semibold text-slate-900">
              Chính sách bảo hành Cellphone Shop
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Theo dõi trạng thái bảo hành, lịch sử kích hoạt và chủ động đặt lịch
              hỗ trợ khi cần thiết.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {basePolicyDetails.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-2xl bg-slate-100/70 p-4 text-sm text-slate-600"
                >
                  <FiInfo className="mt-0.5 text-brand-primary" size={18} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl bg-slate-900 px-6 py-5 text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Tổng thiết bị
              </p>
              <p className="text-3xl font-semibold">{summary.total}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex-1 rounded-2xl bg-emerald-500/10 p-3 text-emerald-200">
                <p className="text-xs uppercase tracking-wide">Còn hạn</p>
                <p className="text-2xl font-semibold">{summary.active}</p>
              </div>
              <div className="flex-1 rounded-2xl bg-rose-500/10 p-3 text-rose-200">
                <p className="text-xs uppercase tracking-wide">Hết hạn</p>
                <p className="text-2xl font-semibold">{summary.expired}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <FiRefreshCw size={14} />
              Cập nhật tự động theo đơn hàng gần nhất
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Thiết bị của bạn
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi thời hạn và chủ động đặt lịch hỗ trợ khi cần.
            </p>
          </div>
          <div className="inline-flex rounded-full bg-slate-100 p-1 text-sm font-medium text-slate-600">
            {["all", "active", "expired"].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-4 py-2 transition ${
                  filter === key ? "bg-white text-slate-900 shadow" : "hover:text-slate-900"
                }`}
              >
                {key === "all" && `Tất cả (${summary.total})`}
                {key === "active" && `Còn hạn (${summary.active})`}
                {key === "expired" && `Hết hạn (${summary.expired})`}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : filteredItems.length ? (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const meta = STATUS_META[item.status] || STATUS_META.active;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            getAssetUrl(item.image) ||
                            "https://placehold.co/72x72?text=No+Img"
                          }
                          alt={item.productName}
                          className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                        />
                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            {item.productName}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            Mã đơn: #{item.orderCode}
                          </p>
                          {item.productSlug ? (
                            <Link
                              to={`/product/${item.productSlug}`}
                              className="text-xs font-medium text-brand-primary underline"
                            >
                              Xem chi tiết sản phẩm
                            </Link>
                          ) : null}
                          {item.productBrand ? (
                            <p className="text-xs text-slate-500">
                              Thương hiệu: {item.productBrand}
                            </p>
                          ) : null}
                          {item.price ? (
                            <p className="text-xs text-slate-500">
                              Giá mua: {formatCurrency(item.price)}
                            </p>
                          ) : null}
                          {item.warrantyPolicy ? (
                            <p className="text-xs text-slate-500">
                              Chính sách: {item.warrantyPolicy}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="ml-auto flex flex-col gap-1 text-sm text-slate-600">
                        <span>Bắt đầu: {formatDate(item.startDate)}</span>
                        <span>Kết thúc: {formatDate(item.endDate)}</span>
                        <span>Thời hạn: {item.warrantyMonths} tháng</span>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              Bạn chưa có thiết bị nào trong danh sách bảo hành.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarrantyPolicy;
