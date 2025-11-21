import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import {
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUserRole,
} from "../../services/api.js";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data } = await fetchAdminUsers();
        const items = Array.isArray(data.data) ? data.data : [];
        setUsers(
          items.slice(0, 20).map((user) => ({
            ...user,
            roleDraft: user.role,
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

  const handleRoleChange = (userId, role) => {
    setUsers((prev) =>
      prev.map((user) =>
        user._id === userId
          ? {
              ...user,
              roleDraft: role,
            }
          : user
      )
    );
  };

  const handleSaveRole = async (user) => {
    const nextRole = user.roleDraft || user.role;
    if (nextRole === user.role) {
      toast.error("Không có thay đổi để lưu");
      return;
    }

    setUpdatingId(user._id);
    try {
      await updateAdminUserRole(user._id, { role: nextRole });
      setUsers((prev) =>
        prev.map((item) =>
          item._id === user._id
            ? {
                ...item,
                role: nextRole,
                roleDraft: nextRole,
              }
            : item
        )
      );
      toast.success("Cập nhật vai trò thành công");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Cập nhật vai trò thất bại";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.role === "admin") {
      toast.error("Không thể xóa tài khoản admin");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa người dùng "${user.email}"?`
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(user._id);
    try {
      await deleteAdminUser(user._id);
      setUsers((prev) => prev.filter((item) => item._id !== user._id));
      toast.success("Đã xóa người dùng");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Xóa người dùng thất bại";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
          Người dùng
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Quản lý người dùng đăng nhập
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Xem nhanh 20 tài khoản đăng ký gần nhất để theo dõi tình trạng truy
          cập vào hệ thống.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/40">
        <div className="grid grid-cols-12 bg-slate-900/80 px-5 py-3 text-xs uppercase tracking-wide text-slate-500">
          <span className="col-span-3">Người dùng</span>
          <span className="col-span-4">Email</span>
          <span className="col-span-2">Vai trò</span>
          <span className="col-span-2 text-right">Ngày tạo</span>
          <span className="col-span-1 text-right">Thao tác</span>
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
                className="grid grid-cols-12 items-center px-5 py-4 text-sm text-slate-200"
              >
                <div className="col-span-3">
                  <p className="font-semibold text-white">
                    {user.name || "Chưa đặt tên"}
                  </p>
                  <p className="text-xs text-slate-500">#{user._id?.slice(-6)}</p>
                </div>
                <div className="col-span-4 text-slate-400">{user.email}</div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={user.roleDraft || user.role}
                      onChange={(event) =>
                        handleRoleChange(user._id, event.target.value)
                      }
                      disabled={updatingId === user._id}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 disabled:cursor-not-allowed"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleSaveRole(user)}
                      disabled={updatingId === user._id}
                      className="rounded-full border border-brand-primary/60 px-3 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingId === user._id ? "Đang lưu..." : "Lưu"}
                    </button>
                  </div>
                </div>
                <div className="col-span-2 text-right text-slate-400">
                  {new Date(user.createdAt).toLocaleString("vi-VN")}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(user)}
                    disabled={
                      deletingId === user._id ||
                      user.role === "admin" ||
                      updatingId === user._id
                    }
                    className="rounded-full border border-red-500/60 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === user._id ? "Đang xóa..." : "Xóa"}
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

export default ManageUsers;
