import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { clearCart } from "../store/slices/cartSlice.js";
import { createOrder } from "../store/slices/orderSlice.js";

const currency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const SHIPPING_FEE = 30000;
const CHECKOUT_STORAGE_KEY = "cellphones_checkout_info";

const getDefaultFormState = () => ({
  fullName: "",
  phone: "",
  address: "",
  paymentMethod: "cod",
});

const loadSavedAddresses = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return [parsed];
    return [];
  } catch (error) {
    console.warn("Failed to load saved addresses:", error);
    return [];
  }
};

const persistSavedAddresses = (addresses) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CHECKOUT_STORAGE_KEY,
      JSON.stringify(addresses)
    );
  } catch (error) {
    console.warn("Failed to persist saved addresses:", error);
  }
};

const buildAddressEntry = (data) => ({
  id: `addr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  fullName: data.fullName.trim(),
  phone: data.phone.trim(),
  address: data.address.trim(),
  paymentMethod: data.paymentMethod || "cod",
});

const normalizeMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return Math.round(numeric);
};

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalAmount } = useSelector((state) => state.cart);
  const { status } = useSelector((state) => state.orders);

  const shippingFee = SHIPPING_FEE;

  const [form, setForm] = useState(() => getDefaultFormState());
  const [savedAddresses, setSavedAddresses] = useState(() => loadSavedAddresses());
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [editingAddressId, setEditingAddressId] = useState("");
  const [editValues, setEditValues] = useState(() => getDefaultFormState());

  const selectedAddress = useMemo(
    () => savedAddresses.find((address) => address.id === selectedAddressId) || null,
    [savedAddresses, selectedAddressId]
  );

  useEffect(() => {
    if (!items.length) {
      navigate("/cart", { replace: true });
    }
  }, [items, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveDefault = () => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error("Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ trước khi lưu.");
      return;
    }
    const newEntry = buildAddressEntry(form);
    setSavedAddresses((prev) => {
      const updated = [...prev, newEntry];
      persistSavedAddresses(updated);
      return updated;
    });
    setSelectedAddressId(newEntry.id);
    toast.success("Đã lưu địa chỉ mặc định.");
  };

  const handleSelectSavedAddress = (event) => {
    const { value } = event.target;
    setSelectedAddressId(value);
    setEditingAddressId("");
    setEditValues(getDefaultFormState());
  };

  const handleApplySelectedAddress = () => {
    if (!selectedAddress) return;
    setForm({
      fullName: selectedAddress.fullName,
      phone: selectedAddress.phone,
      address: selectedAddress.address,
      paymentMethod: selectedAddress.paymentMethod || "cod",
    });
    toast.success("Đã điền thông tin theo địa chỉ đã chọn.");
  };

  const handleStartEdit = () => {
    if (!selectedAddress) return;
    setEditingAddressId(selectedAddress.id);
    setEditValues({
      fullName: selectedAddress.fullName,
      phone: selectedAddress.phone,
      address: selectedAddress.address,
      paymentMethod: selectedAddress.paymentMethod || "cod",
    });
  };

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;
    setEditValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEditedAddress = () => {
    if (!editValues.fullName.trim() || !editValues.phone.trim() || !editValues.address.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin khi chỉnh sửa.");
      return;
    }
    setSavedAddresses((prev) => {
      const updated = prev.map((addr) =>
        addr.id === editingAddressId
          ? {
              ...addr,
              fullName: editValues.fullName.trim(),
              phone: editValues.phone.trim(),
              address: editValues.address.trim(),
              paymentMethod: editValues.paymentMethod || "cod",
            }
          : addr
      );
      persistSavedAddresses(updated);
      return updated;
    });
    setEditingAddressId("");
    toast.success("Đã cập nhật địa chỉ mặc định.");
  };

  const handleCancelEdit = () => {
    setEditingAddressId("");
    setEditValues(getDefaultFormState());
  };

  const handleClearSelectedAddress = () => {
    setSelectedAddressId("");
    setEditingAddressId("");
    setEditValues(getDefaultFormState());
  };

  const startVietqrFlow = ({ reference, transferContent, totals, orderId }) => {
    const normalizedReference =
      typeof reference === "string" && reference.trim() ? reference.trim() : "";
    const normalizedTransfer =
      typeof transferContent === "string" && transferContent.trim()
        ? transferContent.trim()
        : normalizedReference
        ? `Thanh toán đơn hàng ${normalizedReference}`
        : `Thanh toán đơn hàng ${Date.now()}`;
    const itemsAmount = normalizeMoney(totals?.items);
    const shippingAmountCandidate = normalizeMoney(totals?.shipping);
    const shippingAmount =
      shippingAmountCandidate > 0 ? shippingAmountCandidate : SHIPPING_FEE;
    const grandCandidate = Number(totals?.grand);
    const normalizedGrand =
      Number.isFinite(grandCandidate) && grandCandidate > 0
        ? Math.max(0, Math.round(grandCandidate))
        : itemsAmount + shippingAmount;
    const totalToPay =
      normalizedGrand > 0 ? normalizedGrand : itemsAmount + shippingAmount;
    const returnUrl = orderId
      ? `${window.location.origin}/payment-return?orderId=${encodeURIComponent(orderId)}`
      : `${window.location.origin}/`;

    try {
      const payUrl = new URL("http://localhost:5500/pay");
      payUrl.searchParams.set("total", String(totalToPay));
      payUrl.searchParams.set("items", String(itemsAmount));
      payUrl.searchParams.set("shipping", String(shippingAmount));
      payUrl.searchParams.set("addInfo", normalizedTransfer);
      payUrl.searchParams.set("returnUrl", returnUrl);

      window.location.href = payUrl.toString();
    } catch (error) {
      toast.error("Không thể mở trang thanh toán VietQR.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!items.length) return;

    const payload = {
      items: items.map((item) => ({
        productId: item.productId || item.id,
        quantity: item.quantity,
        color: item.color || undefined,
        capacity: item.capacity || undefined,
      })),
      shippingInfo: {
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
      },
      paymentMethod: form.paymentMethod,
      summary: {
        items: totalAmount,
        shipping: shippingFee,
        grand: totalAmount + shippingFee,
      },
    };

    const result = await dispatch(createOrder(payload));
    if (createOrder.fulfilled.match(result)) {
      const createdOrder = result.payload?.data;
      const itemsTotal = normalizeMoney(
        createdOrder?.totals?.items ?? totalAmount ?? 0
      );
      const shippingTotalCandidate = normalizeMoney(
        createdOrder?.totals?.shipping
      );
      const shippingTotal =
        shippingTotalCandidate > 0 ? shippingTotalCandidate : SHIPPING_FEE;
      const grandTotalCandidate = Number(createdOrder?.totals?.grand);
      const grandTotal =
        Number.isFinite(grandTotalCandidate) && grandTotalCandidate > 0
          ? Math.max(0, Math.round(grandTotalCandidate))
          : itemsTotal + shippingTotal;
      const vietqrTotals = {
        items: itemsTotal,
        shipping: shippingTotal,
        grand: grandTotal,
      };

      if (form.paymentMethod === "vietqr") {
        startVietqrFlow({
          reference: createdOrder?.payment?.reference,
          transferContent: createdOrder?.payment?.transferContent,
          totals: vietqrTotals,
          orderId: createdOrder?._id,
        });
        dispatch(clearCart());
        return;
      }

      toast.success("Đặt hàng thành công");
      dispatch(clearCart());
      navigate("/", { replace: true });
    } else if (result.payload) {
      toast.error(result.payload);
    } else {
      toast.error("Không thể đặt hàng. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans">
      <div className="container-safe pt-12">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-slate-900">Thanh toán</h1>
          <p className="mt-2 text-sm text-slate-500">
            Kiểm tra kỹ thông tin trước khi xác nhận và chọn địa chỉ mặc định bạn muốn sử dụng.
          </p>
          <form
            onSubmit={handleSubmit}
            className="mt-10 grid gap-8 lg:grid-cols-[1.4fr,0.6fr]"
          >
            <section className="space-y-8">
              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="text-xl font-semibold text-slate-900">
                  Thông tin người nhận
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Nhập đầy đủ thông tin để giao hàng chính xác. Bạn có thể lưu và quản lý nhiều địa chỉ mặc định khác nhau.
                </p>

                {savedAddresses.length ? (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-600" htmlFor="saved-address-select">
                      Địa chỉ mặc định
                    </label>
                    <select
                      id="saved-address-select"
                      value={selectedAddressId}
                      onChange={handleSelectSavedAddress}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                    >
                      <option value="">-- Chọn địa chỉ mặc định --</option>
                      {savedAddresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.fullName} • {address.phone}
                        </option>
                      ))}
                    </select>

                    {selectedAddress ? (
                      <div className="mt-4 rounded-2xl border border-brand-primary/40 bg-brand-primary/5 p-4 text-sm text-slate-600">
                        <p className="font-semibold text-brand-primary">Thông tin địa chỉ</p>
                        <p className="mt-2 text-slate-800">{selectedAddress.fullName}</p>
                        <p className="text-slate-500">{selectedAddress.phone}</p>
                        <p className="text-slate-500">{selectedAddress.address}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleApplySelectedAddress}
                            className="rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/10"
                          >
                            Dùng địa chỉ này
                          </button>
                          <button
                            type="button"
                            onClick={handleStartEdit}
                            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            onClick={handleClearSelectedAddress}
                            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
                          >
                            Bỏ chọn
                          </button>
                        </div>

                        {editingAddressId === selectedAddress.id ? (
                          <div className="mt-4 space-y-2">
                            <input
                              type="text"
                              name="fullName"
                              value={editValues.fullName}
                              onChange={handleEditInputChange}
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
                              placeholder="Họ và tên"
                            />
                            <input
                              type="text"
                              name="phone"
                              value={editValues.phone}
                              onChange={handleEditInputChange}
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
                              placeholder="Số điện thoại"
                            />
                            <input
                              type="text"
                              name="address"
                              value={editValues.address}
                              onChange={handleEditInputChange}
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
                              placeholder="Địa chỉ"
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={handleSaveEditedAddress}
                                className="rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                              >
                                Lưu thay đổi
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-slate-600"
                    >
                      Họ và tên
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-slate-600"
                    >
                      Số điện thoại
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="0987 654 321"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-slate-600"
                    >
                      Địa chỉ giao hàng
                    </label>
                    <input
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="123 Nguyễn Trãi, Quận 1, TP. HCM"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveDefault}
                    className="rounded-full border border-brand-primary px-5 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/10"
                  >
                    Lưu làm địa chỉ mặc định
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="text-xl font-semibold text-slate-900">
                  Phương thức thanh toán
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand-primary">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={form.paymentMethod === "cod"}
                      onChange={handleChange}
                      className="h-4 w-4 accent-brand-primary"
                    />
                    Thanh toán khi nhận hàng (COD)
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand-primary">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="vietqr"
                      checked={form.paymentMethod === "vietqr"}
                      onChange={handleChange}
                      className="h-4 w-4 accent-brand-primary"
                    />
                    Thanh toán qua VietQR
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Chọn VietQR để nhận mã QR và chuyển khoản trực tuyến. Đơn hàng sẽ được cập nhật ngay khi xác nhận giao dịch.
                </p>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="text-xl font-semibold text-slate-900">
                  Tóm tắt đơn hàng
                </h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Sản phẩm ({items.length})</span>
                    <span>{currency(totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Phí vận chuyển</span>
                    <span>{currency(shippingFee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                    <span>Tổng thanh toán</span>
                    <span>{currency(totalAmount + shippingFee)}</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="mt-6 w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand-dark/50"
                >
                  {status === "loading" ? "Đang xử lý..." : "Đặt hàng"}
                </button>
              </div>
            </aside>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

