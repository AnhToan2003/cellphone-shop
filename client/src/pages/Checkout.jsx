import { useEffect, useState } from "react";
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

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalAmount } = useSelector((state) => state.cart);
  const { status } = useSelector((state) => state.orders);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    paymentMethod: "cod",
  });

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
    };

    const result = await dispatch(createOrder(payload));
    if (createOrder.fulfilled.match(result)) {
      toast.success("Đặt hàng thành công");
      dispatch(clearCart());
      navigate("/", { replace: true });
    } else if (result.payload) {
      toast.error(result.payload);
    } else {
      toast.error("Không thể đặt hàng. Vui lòng thử lại.");
    }
  };

  const shippingFee = totalAmount >= 20000000 ? 0 : 30000;

  return (
    <div className="container-safe py-12">
      <h1 className="text-3xl font-bold text-slate-900">Thanh toán</h1>
      <p className="mt-2 text-sm text-slate-500">
        Vui lòng kiểm tra lại thông tin trước khi xác nhận đơn hàng.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-10 grid gap-8 lg:grid-cols-[1.4fr,0.6fr]"
      >
        <section className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-slate-900">
              Thông tin người nhận
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
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
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-slate-900">
              Hình thức thanh toán
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
                  value="mock"
                  checked={form.paymentMethod === "mock"}
                  onChange={handleChange}
                  className="h-4 w-4 accent-brand-primary"
                />
                Chuyển khoản ngân hàng
              </label>
            </div>
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
  );
};

export default Checkout;
