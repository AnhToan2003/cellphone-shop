import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import {
  fetchAdminUserRankings,
  updateAdminUserRanking,
} from "../../services/api.js";

const TIER_OPTIONS = [
  { value: "bronze", label: "Hạng đồng" },
  { value: "silver", label: "Hạng bạc" },
  { value: "gold", label: "Hạng vàng" },
  { value: "diamond", label: "Hạng kim cương" },
];

const TIER_LABELS = TIER_OPTIONS.reduce(
  (map, option) => ({ ...map, [option.value]: option.label }),
  {}
);

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "--";

const ManageUserRanks = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data } = await fetchAdminUserRankings({ limit: 100 });
        const items = Array.isArray(data.data) ? data.data : [];
        setUsers(
          items.slice(0, 20).map((user) => ({
            ...user,
            tierDraft: user.customerTier || "bronze",
            lifetimeSpendDraft: String(user.lifetimeSpend ?? 0),
          }))
        );
      } catch (error) {
        toast.error("Không thể tải danh sách người dùng");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleTierChange = (userId, tier) => {
    setUsers((prev) =>
      prev.map((user) =>
        user._id === userId
          ? {
              ...user,
              tierDraft: tier,
            }
          : user
      )
    );
  };

  const handleSpendChange = (userId, value) => {
    if (value !== "" && !/^\d+$/.test(value)) {
      return;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user._id === userId
          ? {
              ...user,
              lifetimeSpendDraft: value,
            }
          : user
      )
    );
  };

  const handleSaveRanking = async (user) => {
    const payload = {};
    const spendDraft = user.lifetimeSpendDraft ?? "";
    const parsedSpend =
      spendDraft === "" ? 0 : Number.parseInt(spendDraft, 10);

    if (!Number.isFinite(parsedSpend) || parsedSpend < 0) {
      toast.error("Tổng chi tiêu không hợp lệ");
      return;
    }

    if (parsedSpend !== user.lifetimeSpend) {
      payload.lifetimeSpend = parsedSpend;
    }

    if (user.tierDraft && user.tierDraft !== user.customerTier) {
      payload.customerTier = user.tierDraft;
    }

    if (Object.keys(payload).length === 0) {
      toast.error("Không có thay đổi để lưu");
      return;
    }

    setUpdatingId(user._id);
    try {
      const response = await updateAdminUserRanking(user._id, payload);
      const updated = response?.data?.data || {};
      setUsers((prev) =>
        prev.map((item) =>
          item._id === user._id
            ? {
                ...item,
                customerTier: updated.customerTier ?? item.customerTier,
                lifetimeSpend: updated.lifetimeSpend ?? item.lifetimeSpend,
                tierDraft: updated.customerTier ?? item.tierDraft,
                lifetimeSpendDraft: String(
                  updated.lifetimeSpend ?? item.lifetimeSpend ?? 0
                ),
              }
            : item
        )
      );
      toast.success("Đã cập nhật hạng khách hàng");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Cập nhật hạng thất bại";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
          Khách hàng thân thiết
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Quản lý hạng và tổng chi tiêu
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Điều chỉnh hạng khách hàng thủ công, dùng khi cần xử lý ngoại lệ hoặc
          phản hồi khiếu nại. Hệ thống hiển thị tối đa 20 tài khoản mới nhất.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/40">
        <div className="grid grid-cols-12 bg-slate-900/80 px-5 py-3 text-xs uppercase tracking-wide text-slate-500">
          <span className="col-span-3">Người dùng</span>
          <span className="col-span-3">Email</span>
          <span className="col-span-2">Hạng hiện tại</span>
          <span className="col-span-2">Tổng chi tiêu</span>
          <span className="col-span-2 text-right">Cập nhật</span>
        </div>
        {loading ? (
          <div className="space-y-3 px-5 py-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-800" />
            ))}
          </div>
        ) : users.length ? (
          <div className="divide-y divide-slate-800">
            {users.map((user) => (
              <div
                key={user._id}
                className="grid grid-cols-12 items-center gap-4 px-5 py-4 text-sm text-slate-200"
              >
                <div className="col-span-3">
                  <p className="font-semibold text-white">
                    {user.name || "Chưa đặt tên"}
                  </p>
                  <p className="text-xs text-slate-500">
                    #{user._id?.slice(-6)} · {formatDateTime(user.createdAt)}
                  </p>
                </div>
                <div className="col-span-3 text-slate-400">
                  <p>{user.email}</p>
                  <p className="text-xs text-slate-500">
                    Hạng hiện tại:{" "}
                    {TIER_LABELS[user.customerTier] || "Chưa xác định"}
                  </p>
                </div>
                <div className="col-span-2">
                  <select
                    value={user.tierDraft || user.customerTier || "bronze"}
                    onChange={(event) =>
                      handleTierChange(user._id, event.target.value)
                    }
                    disabled={updatingId === user._id}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 disabled:cursor-not-allowed"
                  >
                    {TIER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={user.lifetimeSpendDraft ?? ""}
                    onChange={(event) =>
                      handleSpendChange(user._id, event.target.value)
                    }
                    disabled={updatingId === user._id}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 disabled:cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Nháp: {formatCurrency(Number(user.lifetimeSpendDraft || 0))}
                  </p>
                  <p className="text-xs text-slate-500">
                    Thực tế: {formatCurrency(user.lifetimeSpend)}
                  </p>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveRanking(user)}
                    disabled={updatingId === user._id}
                    className="rounded-full border border-emerald-500/60 px-4 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updatingId === user._id ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            Không có người dùng nào.
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUserRanks;
