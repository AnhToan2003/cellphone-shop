import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiClock, FiInfo, FiRefreshCw, FiShield } from "react-icons/fi";

import { useAuth } from "../context/AuthContext.jsx";
import { fetchMyWarrantyItems } from "../services/api.js";
import { getAssetUrl } from "../utils/assets.js";

const STATUS_META = {
  active: {
    label: "Còn hiệu lực",
    tone: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  expired: {
    label: "Hết hạn",
    tone: "bg-rose-100 text-rose-700 border border-rose-200",
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDate = (value) =>
  new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

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
        if (payload?.items) {
          setSummary({
            total: payload.total ?? payload.items.length,
            active: payload.active ?? 0,
            expired: payload.expired ?? 0,
            items: payload.items,
          });
        } else {
          setSummary({ total: 0, active: 0, expired: 0, items: [] });
        }
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Không thể tải thông tin bảo hành. Vui lòng thử lại sau."
        );
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

  const basePolicyDetails = [
    "Tất cả sản phẩm được bảo hành tiêu chuẩn 12 tháng kể từ ngày mua hàng.",
    "Áp dụng đổi mới trong 10 ngày đầu khi phát sinh lỗi phần cứng do nhà sản xuất.",
    "Không áp dụng bảo hành với các trường hợp rơi vỡ, vào nước hoặc tự ý can thiệp phần cứng.",
    "Vui lòng giữ hoá đơn mua hàng và thông tin sản phẩm khi mang đến trung tâm bảo hành.",
  ];

  return (
    <div className="container-safe py-12 font-sans">
      <div className="mb-10 rounded-3xl bg-white p-8 shadow-card">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <FiShield size={28} />
          </div>
          <div className="flex-1 min-w-[240px]">
            <h1 className="text-3xl font-semibold text-slate-900">
              Chính sách bảo hành Cellphone Shop
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Chúng tôi cam kết đồng hành cùng khách hàng trong suốt vòng đời
              sản phẩm với chính sách bảo hành rõ ràng, minh bạch.
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
          <div className="flex flex-col gap-3 rounded-2xl bg-slate-100/60 p-5 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <FiRefreshCw className="text-brand-primary" size={20} />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Sản phẩm còn bảo hành
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {summary.active}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiClock className="text-slate-500" size={20} />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Tổng sản phẩm đã mua
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {summary.total}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Danh sách sản phẩm bảo hành
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi thời hạn bảo hành và chính sách cụ thể của từng sản phẩm.
            </p>
          </div>
          <div className="inline-flex rounded-full bg-slate-100 p-1 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-4 py-2 transition ${
                filter === "all"
                  ? "bg-white text-slate-900 shadow"
                  : "hover:text-slate-900"
              }`}
            >
              Tất cả ({summary.total})
            </button>
            <button
              type="button"
              onClick={() => setFilter("active")}
              className={`rounded-full px-4 py-2 transition ${
                filter === "active"
                  ? "bg-white text-slate-900 shadow"
                  : "hover:text-slate-900"
              }`}
            >
              Còn hạn ({summary.active})
            </button>
            <button
              type="button"
              onClick={() => setFilter("expired")}
              className={`rounded-full px-4 py-2 transition ${
                filter === "expired"
                  ? "bg-white text-slate-900 shadow"
                  : "hover:text-slate-900"
              }`}
            >
              Hết hạn ({summary.expired})
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-slate-100 p-6"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-slate-200" />
                    <div className="h-3 w-24 rounded bg-slate-200" />
                  </div>
                </div>
                <div className="h-3 w-32 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-24 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {filteredItems.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center text-sm text-slate-500">
                {summary.total === 0
                  ? "Bạn chưa có sản phẩm nào đủ điều kiện bảo hành."
                  : "Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại."}
                <div className="mt-3">
                  <Link
                    to="/orders"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-dark"
                  >
                    Xem lịch sử đơn hàng
                  </Link>
                </div>
              </div>
            ) : (
              filteredItems.map((item) => {
                const meta = STATUS_META[item.status] || STATUS_META.active;
                const policySentences = item.warrantyPolicy
                  ? item.warrantyPolicy
                      .split(/(?<=[.!?])\s+/)
                      .map((sentence) => sentence.trim())
                      .filter(Boolean)
                  : [];

                return (
                  <article
                    key={`${item.orderId}-${item.productId}-${item.activatedAt}`}
                    className="flex flex-col gap-5 rounded-2xl border border-slate-100 p-6 shadow-sm transition hover:shadow-lg"
                  >
                    <header className="flex items-start gap-4">
                      <img
                        src={
                          getAssetUrl(item.image) ||
                          "https://placehold.co/96x96?text=No+Image"
                        }
                        alt={item.productName}
                        className="h-20 w-20 rounded-xl border border-slate-100 object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {item.productName}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}
                          >
                            <FiShield size={14} />
                            {meta.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Mã đơn #{item.orderCode} • Bảo hành {item.warrantyMonths} tháng
                          {item.productBrand ? ` • ${item.productBrand}` : ""}
                        </p>
                      </div>
                    </header>

                    <dl className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 md:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Kích hoạt
                        </dt>
                        <dd className="font-medium text-slate-900">
                          {formatDate(item.activatedAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Hết hạn dự kiến
                        </dt>
                        <dd className="font-medium text-slate-900">
                          {formatDate(item.expiresAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Thuộc tính sản phẩm
                        </dt>
                        <dd>
                          {item.capacity ? `${item.capacity} • ` : ""}
                          {item.color || "Mặc định"} • Số lượng: {item.quantity}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Giá tại thời điểm mua
                        </dt>
                        <dd>
                          {formatCurrency(item.price ?? 0)} / sản phẩm
                        </dd>
                      </div>
                    </dl>

                    {policySentences.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          Chính sách áp dụng
                        </h4>
                        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-slate-600">
                          {policySentences.map((sentence, idx) => (
                            <li key={idx}>{sentence}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {item.productSlug ? (
                      <div>
                        <Link
                          to={`/product/${item.productSlug}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary transition hover:text-brand-dark"
                        >
                          Xem chi tiết sản phẩm
                        </Link>
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WarrantyPolicy;
