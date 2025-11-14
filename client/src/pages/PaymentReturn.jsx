import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

import { fetchMyOrders } from "../store/slices/orderSlice.js";
import { confirmMyOrderPayment } from "../services/api.js";

const STATUSES = {
  processing: {
    title: "Đang xác nhận thanh toán",
    description:
      "Vui lòng chờ trong giây lát. Chúng tôi đang xử lý giao dịch VietQR của bạn.",
  },
  success: {
    title: "Thanh toán đã được xác nhận",
    description:
      "Cảm ơn bạn đã thanh toán qua VietQR. Đơn hàng của bạn sẽ được cập nhật ngay.",
  },
  error: {
    title: "Không thể xác nhận thanh toán",
    description:
      "Đã xảy ra lỗi khi xác nhận giao dịch. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
  },
};

const resolveHomeUrl = () => "/";

const PaymentReturn = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  const [status, setStatus] = useState("processing");
  const [orderId, setOrderId] = useState("");

  const statusMeta = useMemo(
    () => STATUSES[status] ?? STATUSES.processing,
    [status]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const foundOrderId = params.get("orderId") || params.get("order");

    if (!foundOrderId) {
      toast.error(
        "Không tìm thấy mã đơn hàng cần xác nhận thanh toán. Vui lòng thử lại."
      );
      setStatus("error");
      const homeUrl = resolveHomeUrl();
      window.location.href = homeUrl;
      return;
    }

    setOrderId(foundOrderId);
    let isActive = true;

    const redirectHome = () => {
      const homeUrl = resolveHomeUrl();
      window.location.href = homeUrl;
    };

    const confirmPayment = async () => {
      setStatus("processing");
      try {
        await confirmMyOrderPayment(foundOrderId);
        toast.success("Đã xác nhận thanh toán VietQR.");
        dispatch(fetchMyOrders());
        if (isActive) {
          setStatus("success");
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          "Không thể xác nhận thanh toán. Vui lòng thử lại sau.";
        toast.error(message);
        if (isActive) {
          setStatus("error");
        }
      } finally {
        if (isActive) {
          setTimeout(redirectHome, 1500);
        }
      }
    };

    confirmPayment();

    return () => {
      isActive = false;
    };
  }, [location.search, dispatch]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-24 font-sans">
      <div className="container-safe flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="max-w-lg rounded-2xl bg-white p-8 shadow">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
              status === "success"
                ? "bg-emerald-100 text-emerald-600"
                : status === "error"
                ? "bg-rose-100 text-rose-600"
                : "bg-amber-100 text-amber-600"
            }`}
          >
            {status === "success" ? "✓" : status === "error" ? "!" : "…"}
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-slate-900">
            {statusMeta.title}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {statusMeta.description}
          </p>

          {orderId && status !== "processing" ? (
            <p className="mt-4 text-xs text-slate-400">
              Mã đơn hàng:{" "}
              <span className="font-medium text-slate-600">{orderId}</span>
            </p>
          ) : null}

          <p className="mt-6 text-xs text-slate-400">
            Bạn sẽ được chuyển về trang chủ trong giây lát.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentReturn;
