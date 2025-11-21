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

const SHIPPING_FEE = 30000;

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

  const startVietqrFlow = ({ reference, transferContent, totals, orderId }) => {
    const normalizedReference =
      typeof reference === "string" && reference.trim() ? reference.trim() : "";
    const normalizedTransfer =
      typeof transferContent === "string" && transferContent.trim()
        ? transferContent.trim()
        : normalizedReference
        ? `Thanh to\u00E1n \u0111\u01A1n h\u00E0ng ${normalizedReference}`
        : `Thanh to\u00E1n \u0111\u01A1n h\u00E0ng ${Date.now()}`;
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
      toast.error("Kh\u00F4ng th\u1EC3 m\u1EDF trang thanh to\u00E1n VietQR.");
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

      toast.success("\u0110\u1EB7t h\u00E0ng th\u00E0nh c\u00F4ng");
      dispatch(clearCart());
      navigate("/", { replace: true });
    } else if (result.payload) {
      toast.error(result.payload);
    } else {
      toast.error("Kh+¶ng thﬂ+‚ -Êﬂ¶+t h+·ng. Vui l+¶ng thﬂ+° lﬂ¶Ìi.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans">
      <div className="container-safe pt-12">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-slate-900">Thanh to+Ìn</h1>
          <p className="mt-2 text-sm text-slate-500">
            Vui l+¶ng kiﬂ+‚m tra kﬂ+¶ th+¶ng tin tr¶¶ﬂ+¢c khi x+Ìc nhﬂ¶°n -Ê¶Ìn h+·ng.
          </p>
        <form
          onSubmit={handleSubmit}
          className="mt-10 grid gap-8 lg:grid-cols-[1.4fr,0.6fr]"
        >
          <section className="space-y-8">
            <div className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-slate-900">
                Th+¶ng tin ng¶¶ﬂ+•i nhﬂ¶°n
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Nhﬂ¶°p -Ê+¶ng th+¶ng tin -Êﬂ+‚ ch+¶ng t+¶i c+¶ thﬂ+‚ giao h+·ng ch+°nh x+Ìc.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-slate-600"
                  >
                    Hﬂ+Ï v+· t+¨n
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="Nguyﬂ+‡n V-‚n A"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-slate-600"
                  >
                    Sﬂ+Ê -Êiﬂ+Án thoﬂ¶Ìi
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
                    -…ﬂ+Ôa chﬂ+Î giao h+·ng
                  </label>
                  <input
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="123 Nguyﬂ+‡n Tr+˙i, Quﬂ¶°n 1, TP. HCM"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-slate-900">
                H+ºnh thﬂ+¨c thanh to+Ìn
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
                  Thanh to+Ìn khi nhﬂ¶°n h+·ng (COD)
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
                  Thanh to+Ìn qua VietQR
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Chﬂ+Ïn VietQR -Êﬂ+‚ nhﬂ¶°n m+˙ QR v+· chuyﬂ+‚n khoﬂ¶˙n trﬂ+¶c tuyﬂ¶+n. -…¶Ìn h+·ng
                sﬂ¶+ -Ê¶¶ﬂ+˙c cﬂ¶°p nhﬂ¶°t ngay khi ch+¶ng t+¶i x+Ìc nhﬂ¶°n giao dﬂ+Ôch th+·nh
                c+¶ng.
              </p>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-slate-900">
                T+¶m tﬂ¶ªt -Ê¶Ìn h+·ng
              </h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Sﬂ¶˙n phﬂ¶¨m ({items.length})</span>
                  <span>{currency(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ph+° vﬂ¶°n chuyﬂ+‚n</span>
                  <span>{currency(shippingFee)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                  <span>Tﬂ+Úng thanh to+Ìn</span>
                  <span>{currency(totalAmount + shippingFee)}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-6 w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand-dark/50"
              >
                {status === "loading" ? "-…ang xﬂ+° l++..." : "-…ﬂ¶+t h+·ng"}
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
