import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiXCircle,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

import { useAuth } from "../context/AuthContext.jsx";
import { lookupWarrantyByPhone, fetchMyWarrantyItems } from "../services/api.js";
import { getAssetUrl } from "../utils/assets.js";

const STATUS_META = {
  active: {
    label: "Còn hiệu lực",
    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
    badge: "bg-emerald-500",
  },
  expired: {
    label: "Đã hết hạn",
    tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30",
    badge: "bg-rose-500",
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
  {
    title: "Bảo hành theo Số Điện Thoại",
    desc: "Mọi sản phẩm Apple được kích hoạt bảo hành điện tử tự động ngay khi mua. Không cần giữ giấy tờ hay hoá đơn giấy.",
  },
  {
    title: "1 Đổi 1 trong 30 Ngày",
    desc: "Áp dụng đổi máy mới hoặc linh kiện tương đương ngay lập tức nếu phát sinh lỗi phần cứng từ nhà sản xuất.",
  },
  {
    title: "Linh kiện Apple Chính Hãng",
    desc: "Cam kết mainboard, màn hình, camera, pin chính hãng đạt chuẩn chất lượng khắt khe nhất.",
  },
  {
    title: "Hỗ trợ Kỹ thuật & Vệ sinh Trọn Đời",
    desc: "Miễn phí cài đặt phần mềm, nâng cấp iOS, vệ sinh máy định kỳ và đo dung lượng pin trọn đời tại Showroom.",
  },
];

const WarrantyPolicy = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [phoneInput, setPhoneInput] = useState(searchParams.get("phone") || "");
  const [searchedPhone, setSearchedPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filter, setFilter] = useState("all");

  const handleLookup = async (phoneToSearch) => {
    const target = (phoneToSearch ?? phoneInput).trim();
    if (!target) {
      toast.error("Vui lòng nhập số điện thoại để tra cứu bảo hành");
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      setSearchedPhone(target);
      setSearchParams({ phone: target }, { replace: true });

      const { data } = await lookupWarrantyByPhone(target);
      if (data?.success) {
        const resultItems = Array.isArray(data.data?.items) ? data.data.items : [];
        setItems(resultItems);
        setCustomerName(data.data?.customerName || "Quý khách");
        if (resultItems.length === 0) {
          toast("Không tìm thấy thông tin bảo hành cho số điện thoại này", {
            icon: "ℹ️",
          });
        } else {
          toast.success(`Tìm thấy ${resultItems.length} thiết bị bảo hành!`);
        }
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Không thể tra cứu bảo hành. Vui lòng kiểm tra lại số điện thoại.";
      toast.error(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleLookup(phoneInput);
  };

  // Auto lookup if phone in URL param or if logged in with phone
  useEffect(() => {
    const urlPhone = searchParams.get("phone");
    if (urlPhone) {
      setPhoneInput(urlPhone);
      handleLookup(urlPhone);
    } else if (isAuthenticated && user?.phone) {
      setPhoneInput(user.phone);
      handleLookup(user.phone);
    } else if (isAuthenticated) {
      fetchMyWarrantyItems()
        .then(({ data }) => {
          if (data?.success && data.data?.items?.length) {
            setItems(data.data.items);
            setCustomerName(user?.name || "Quý khách");
            setHasSearched(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.status === "active").length;
    const expired = total - active;
    return { total, active, expired };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === "active") return items.filter((i) => i.status === "active");
    if (filter === "expired") return items.filter((i) => i.status === "expired");
    return items;
  }, [items, filter]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans dark:bg-slate-950">
      <div className="container-safe space-y-10">
        {/* HERO LOOKUP BANNER */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-6 sm:p-10 text-white shadow-2xl dark:border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
              <FiShield size={14} />
              <span>Hệ Thống Bảo Hành Điện Tử Ngọc Triết Store</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Tra Cứu Bảo Hành Theo <span className="text-blue-400">Số Điện Thoại</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mọi sản phẩm Apple mua tại Ngọc Triết Store đều được kích hoạt bảo hành điện tử chính hãng theo số điện thoại người mua. Quý khách chỉ cần nhập SĐT để kiểm tra thời hạn và thông tin máy.
            </p>

            {/* SEARCH FORM */}
            <form onSubmit={handleFormSubmit} className="pt-2">
              <div className="flex flex-col sm:flex-row items-stretch gap-3 max-w-xl">
                <div className="relative flex-1">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Nhập số điện thoại mua hàng (Ví dụ: 039 555 4268)..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition disabled:opacity-50"
                >
                  <FiSearch size={16} />
                  <span>{loading ? "Đang tra cứu..." : "Tra cứu bảo hành"}</span>
                </button>
              </div>

              {/* Quick sample link */}
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <span>Hotline hỗ trợ bảo hành:</span>
                <a
                  href="tel:0395554268"
                  className="font-bold text-blue-400 hover:underline flex items-center gap-1"
                >
                  <FiPhone size={12} />
                  039 555 4268
                </a>
                <span>(Ngọc Triết Store)</span>
              </div>
            </form>
          </div>

          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
        </div>

        {/* SEARCH RESULTS SECTION */}
        {hasSearched && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                  Kết quả tra cứu cho số điện thoại
                </p>
                <div className="mt-1 flex items-baseline gap-3">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {searchedPhone}
                  </h2>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    • {customerName}
                  </span>
                </div>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filter === "all"
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Tất cả ({stats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("active")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filter === "active"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-emerald-600"
                  }`}
                >
                  <FiCheckCircle size={13} />
                  <span>Còn hạn ({stats.active})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("expired")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filter === "expired"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-rose-600"
                  }`}
                >
                  <FiXCircle size={13} />
                  <span>Hết hạn ({stats.expired})</span>
                </button>
              </div>
            </div>

            {/* ITEMS LIST */}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div key={idx} className="h-56 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {filteredItems.map((item, index) => {
                  const meta = STATUS_META[item.status] || STATUS_META.active;
                  const isStore = item.paymentMethod === "store";

                  return (
                    <div
                      key={item.id || index}
                      className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="space-y-4">
                        {/* Top: Status & Order Code */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                            Đơn hàng #{item.orderCode}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-bold ${meta.tone}`}>
                            <span className={`h-2 w-2 rounded-full ${meta.badge}`} />
                            {meta.label}
                            {item.status === "active" && item.daysRemaining > 0 && (
                              <span className="text-[11px] font-normal opacity-90">
                                (Còn {item.daysRemaining} ngày)
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Product Info */}
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              getAssetUrl(item.image) ||
                              "https://placehold.co/80x80?text=Apple"
                            }
                            alt={item.productName}
                            className="h-20 w-20 shrink-0 rounded-2xl border border-slate-200 bg-slate-50 object-contain p-2 dark:border-slate-700 dark:bg-slate-950"
                          />
                          <div className="min-w-0 flex-1">
                            {item.productSlug ? (
                              <Link
                                to={`/product/${item.productSlug}`}
                                className="text-base font-extrabold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 transition truncate block"
                              >
                                {item.productName}
                              </Link>
                            ) : (
                              <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                                {item.productName}
                              </h3>
                            )}

                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                              {item.color && (
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {item.color}
                                </span>
                              )}
                              {item.capacity && (
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {item.capacity}
                                </span>
                              )}
                              <span className="text-slate-500">
                                {isStore ? "• Nhận tại Showroom" : "• Giao Ship COD"}
                              </span>
                            </div>

                            {item.price ? (
                              <p className="mt-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(item.price)}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Warranty Schedule Grid */}
                        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/60">
                          <div>
                            <span className="text-slate-500 block">Kích hoạt bảo hành:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {formatDate(item.activatedAt)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Thời hạn cam kết:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {item.warrantyMonths || 12} tháng Apple
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Ngày hết hạn:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {formatDate(item.expiresAt)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Quyền lợi:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              1 đổi 1 trong 30 ngày
                            </span>
                          </div>
                        </div>

                        {/* Special perks note */}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                          <p className="flex items-center gap-1.5">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>Bảo hành phần cứng, nguồn, mainboard chuẩn cam kết Apple</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="text-blue-500 font-bold">✓</span>
                            <span>Miễn phí kiểm tra pin, cài đặt phần mềm &amp; vệ sinh trọn đời</span>
                          </p>
                        </div>
                      </div>

                      {/* Contact Action */}
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Cần hỗ trợ máy?</span>
                        <a
                          href="tel:0395554268"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition"
                        >
                          <FiPhone size={13} />
                          <span>Hotline Kỹ Thuật: 039 555 4268</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
                  <FiAlertCircle size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Không tìm thấy thiết bị nào cho số điện thoại {searchedPhone}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Quý khách vui lòng kiểm tra lại số điện thoại đã đăng ký khi đặt hàng, hoặc liên hệ ngay hotline của cửa hàng để kỹ thuật viên kiểm tra trực tiếp.
                </p>
                <div className="mt-5">
                  <a
                    href="tel:0395554268"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow"
                  >
                    <FiPhone size={14} />
                    <span>Gọi Hotline Hỗ Trợ: 039 555 4268</span>
                  </a>
                </div>
              </div>
            )}
          </section>
        )}

        {/* WARRANTY POLICIES GRID */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Chính Sách Bảo Hành Tiêu Chuẩn Tại Ngọc Triết Store
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Minh bạch, nhanh chóng và tận tâm vì trải nghiệm tốt nhất của khách hàng Apple.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {basePolicyDetails.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold mb-3">
                    0{idx + 1}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed dark:text-slate-400">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Showroom Contact Card */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-100 p-6 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Showroom Tiếp Nhận Bảo Hành Ngọc Triết Store
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Quý khách có thể mang máy đến trực tiếp showroom hoặc gửi chuyển phát bưu điện nếu ở xa.
              </p>
            </div>
            <a
              href="tel:0395554268"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition shadow"
            >
              <FiPhone size={14} />
              <span>Hotline 24/7: 039 555 4268</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WarrantyPolicy;
