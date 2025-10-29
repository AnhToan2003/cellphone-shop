import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import {
  clearCart,
  decreaseQuantity,
  increaseQuantity,
  removeItem,
} from "../store/slices/cartSlice.js";

const currency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalAmount, totalQuantity } = useSelector(
    (state) => state.cart
  );

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (!items.length) {
    return (
      <div className="container-safe py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Giỏ hàng của bạn đang trống
        </h1>
        <p className="mt-3 text-slate-500">
          Khám phá ưu đãi hấp dẫn và thêm sản phẩm yêu thích vào giỏ ngay hôm
          nay.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="container-safe py-12">
      <h1 className="text-3xl font-bold text-slate-900">Giỏ hàng</h1>
      <p className="mt-2 text-sm text-slate-500">
        Bạn có {totalQuantity} sản phẩm sẵn sàng thanh toán.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-2xl bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-1 items-center gap-4">
                <img
                  src={
                    item.image || "https://placehold.co/120x120?text=No+Image"
                  }
                  alt={item.name}
                  className="h-24 w-24 rounded-lg bg-slate-100 object-contain"
                />
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {item.name}
                  </h3>
                  {(item.color || item.capacity) && (
                    <p className="mt-1 text-xs text-slate-400">
                      {item.color ? `Màu: ${item.color}` : ""}
                      {item.color && item.capacity ? " • " : ""}
                      {item.capacity ? `Dung lượng: ${item.capacity}` : ""}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-slate-500">
                    {currency(item.price)}
                  </p>
                  <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => dispatch(decreaseQuantity(item.id))}
                      className="h-9 w-9 text-lg font-semibold text-slate-600"
                      aria-label="Giảm số lượng"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => dispatch(increaseQuantity(item.id))}
                      className="h-9 w-9 text-lg font-semibold text-slate-600"
                      aria-label="Tăng số lượng"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 sm:mt-0 sm:flex-col sm:items-end sm:gap-2">
                <p className="text-base font-semibold text-slate-900">
                  {currency(item.price * item.quantity)}
                </p>
                <button
                  type="button"
                  onClick={() => dispatch(removeItem(item.id))}
                  className="text-sm font-semibold text-brand-primary hover:text-brand-dark"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-slate-900">
            Thông tin đơn hàng
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span>Tạm tính</span>
              <span>{currency(totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Phí vận chuyển</span>
              <span>Được tính khi thanh toán</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Tổng cộng</span>
              <span>{currency(totalAmount)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            className="mt-6 w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Tiến hành thanh toán
          </button>
          <button
            type="button"
            onClick={() => dispatch(clearCart())}
            className="mt-3 w-full rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-brand-primary hover:text-brand-primary"
          >
            Xóa giỏ hàng
          </button>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
