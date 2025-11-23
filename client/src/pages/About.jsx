import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const FACTS = [
  { label: "Trung tâm giao nhận", value: "24+", hint: "Phủ sóng toàn quốc, giao nhanh 2H" },
  { label: "Khách hàng hài lòng", value: "1.2M", hint: "Đánh giá 4.8/5 từ cộng đồng" },
  { label: "Đối tác chiến lược", value: "30+", hint: "Apple, Samsung, Xiaomi, Oppo, vivo" },
  { label: "Đổi trả dễ dàng", value: "30 ngày", hint: "Đổi sản phẩm lỗi với quy trình minh bạch" },
];

const VALUES = [
  {
    title: "Minh bạch & tận tâm",
    desc: "Giá niêm yết rõ ràng, tư vấn theo nhu cầu thực tế thay vì chạy doanh số.",
    badge: "Niềm tin",
  },
  {
    title: "Dịch vụ đa kênh",
    desc: "Mua tại cửa hàng, website hay chat với trợ lý AI đều đồng bộ tài khoản & ưu đãi.",
    badge: "Omni-channel",
  },
  {
    title: "Chăm sóc trọn vòng đời",
    desc: "Từ trade-in, trả góp, bảo hành đến nâng cấp sau này đều có gói phù hợp.",
    badge: "Care+",
  },
];

const TIMELINE = [
  {
    year: "2015",
    title: "Khởi đầu từ cửa hàng nhỏ",
    desc: "Bắt đầu với đam mê công nghệ và dịch vụ khách hàng 1:1.",
  },
  {
    year: "2019",
    title: "Mở rộng toàn quốc",
    desc: "Xây dựng mạng lưới giao nhận 2H và trung tâm bảo hành liên kết.",
  },
  {
    year: "2023",
    title: "Chuyển đổi số",
    desc: "Ra mắt trải nghiệm mua sắm đồng bộ web/app và trợ lý AI hỗ trợ 24/7.",
  },
  {
    year: "Hôm nay",
    title: "Đồng hành cùng bạn",
    desc: "Tiếp tục tối ưu giá, ưu đãi và dịch vụ hậu mãi để bạn yên tâm nâng cấp thiết bị.",
  },
];

const FAQ_ITEMS = [
  {
    id: "delivery",
    question: "Thời gian giao hàng bao lâu?",
    answer:
      "Các khu vực trung tâm được giao trong 2 giờ. Tỉnh/thành khác thường 1-3 ngày làm việc tùy đối tác vận chuyển. Bạn sẽ nhận được mã theo dõi ngay sau khi đơn được xác nhận.",
  },
  {
    id: "warranty",
    question: "Chính sách bảo hành và đổi trả như thế nào?",
    answer:
      "Sản phẩm lỗi do nhà sản xuất: đổi mới trong 30 ngày hoặc bảo hành theo hãng. Hàng đổi trả cần đầy đủ phụ kiện/hộp, tình trạng không hư hỏng do người dùng.",
  },
  {
    id: "tradein",
    question: "Có hỗ trợ thu cũ đổi mới không?",
    answer:
      "Có. Trợ lý sẽ hỗ trợ ước tính nhanh, sau đó định giá chi tiết tại điểm nhận hoặc qua đối tác thu cũ. Giá thu được trừ trực tiếp vào đơn mới.",
  },
  {
    id: "payment",
    question: "Tôi có thể thanh toán như thế nào?",
    answer:
      "Hỗ trợ COD, chuyển khoản, ví điện tử, QR, và trả góp qua thẻ tín dụng/đối tác tài chính. Ưu đãi trả góp 0% áp dụng cho nhiều mẫu flagship.",
  },
  {
    id: "support",
    question: "Cần hỗ trợ nhanh tôi liên hệ ở đâu?",
    answer:
      "Gõ ngay tại hộp chat trợ lý, gọi hotline 0794 460 285, hoặc ghé cửa hàng gần nhất. Chúng tôi trực 08:00 - 21:00 mỗi ngày.",
  },
];

const AboutPage = ({ initialSection = "about" }) => {
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState(FAQ_ITEMS[0].id);

  const shouldFocusFaq = useMemo(() => {
    if (initialSection === "faq") return true;
    if (location.pathname.endsWith("/faq")) return true;
    return location.hash.includes("faq");
  }, [initialSection, location.hash, location.pathname]);

  useEffect(() => {
    if (!shouldFocusFaq) return;
    const handle = requestAnimationFrame(() => {
      document.getElementById("faq-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => cancelAnimationFrame(handle);
  }, [shouldFocusFaq]);

  return (
    <div className="bg-gradient-to-b from-white via-white to-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-primary via-brand-light to-aurora text-white">
        <span className="pointer-events-none absolute inset-0 bg-hero-glow opacity-80" aria-hidden />
        <div className="container-safe relative z-10 grid gap-10 py-16 lg:grid-cols-[1.2fr_0.9fr] lg:items-center">
          <div className="space-y-5">
            <p className="pill-badge bg-white/15 text-white">Về Cellphone Shop</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              Mang công nghệ mới nhất đến gần bạn hơn, cùng dịch vụ tận tâm 24/7.
            </h1>
            <p className="text-base text-white/80">
              Chúng tôi tin rằng thiết bị di động không chỉ là công cụ, mà là nhịp sống. Từ flagship tới
              thiết bị phổ thông, mọi sản phẩm đều được chọn lọc, kèm gói bảo vệ và hỗ trợ sau bán rõ ràng.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold">
                Trợ lý AI 24/7
              </span>
              <span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold">
                Giao nhanh 2H
              </span>
              <span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold">
                Đổi mới 30 ngày
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="#faq-section"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-primary shadow-lg shadow-white/30 transition hover:-translate-y-0.5"
              >
                Xem câu hỏi thường gặp
              </a>
              <span className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white/90">
                Hotline: 0794 460 285
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-4xl border border-white/30 bg-white/15 p-6 shadow-2xl backdrop-blur">
              <p className="text-sm uppercase tracking-[0.28em] text-white/70">Cam kết</p>
              <h3 className="mt-3 text-2xl font-semibold">
                Giá tốt, nguồn gốc rõ ràng, bảo hành chính hãng.
              </h3>
              <p className="mt-2 text-white/80">
                Thông tin sản phẩm, khuyến mãi, ưu đãi trả góp được cập nhật minh bạch theo thời gian thực.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {["Ưu đãi độc quyền", "Thu cũ đổi mới", "Hỗ trợ trả góp", "Trả kết quả nhanh"].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold"
                    >
                      {item}
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="motion-card rounded-3xl border border-white/20 bg-white/10 px-4 py-4 text-white shadow-lg backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-white/70">{fact.label}</p>
                  <p className="mt-2 text-2xl font-bold">{fact.value}</p>
                  <p className="mt-1 text-xs text-white/75">{fact.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-safe grid gap-8 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-6">
          <p className="pill-badge bg-white text-slate-600">Giá trị & Dịch vụ</p>
          <h2 className="text-3xl font-semibold text-slate-900">Điểm khác biệt của chúng tôi</h2>
          <p className="text-base text-slate-600">
            Mỗi chính sách được thiết kế xoay quanh trải nghiệm của bạn: rõ ràng, nhanh chóng, và đồng
            nhất trên mọi kênh.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {VALUES.map((item, index) => (
              <div
                key={item.title}
                className={`motion-panel relative rounded-3xl border border-slate-100 bg-white p-6 shadow-card ${
                  index === 1 ? "md:-mt-6" : ""
                }`}
              >
                <span className="pill-badge bg-brand-light/10 text-brand-primary">{item.badge}</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-4xl border border-slate-100 bg-white p-6 shadow-card">
          <div
            className="absolute inset-0 bg-gradient-to-br from-brand-light/15 via-white to-aurora/10"
            aria-hidden
          />
          <div className="relative space-y-5">
            <p className="pill-badge bg-brand-primary/10 text-brand-primary">Hành trình</p>
            <h3 className="text-2xl font-semibold text-slate-900">Được xây dựng từ niềm tin</h3>
            <div className="mt-4 space-y-4">
              {TIMELINE.map((item, idx) => (
                <div key={item.year} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-brand-primary shadow shadow-brand-primary/40" />
                    {idx !== TIMELINE.length - 1 && (
                      <div className="mt-1 h-full w-[2px] flex-1 bg-gradient-to-b from-brand-primary/50 to-transparent" />
                    )}
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4 shadow-inner shadow-slate-100 ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
                      {item.year}
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq-section" className="bg-white py-14">
        <div className="container-safe grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div className="space-y-4">
            <p className="pill-badge bg-brand-primary/10 text-brand-primary">FAQ</p>
            <h2 className="text-3xl font-semibold text-slate-900">Câu hỏi thường gặp</h2>
            <p className="text-base text-slate-600">
              Nếu bạn cần thêm thông tin, hãy gõ ngay tại hộp chat hoặc gọi hotline. Đội ngũ sẽ phản hồi
              nhanh nhất.
            </p>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Mẹo nhanh:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Ghi rõ nhu cầu (dòng máy, ngân sách, ưu tiên) để trợ lý gợi ý chính xác.</li>
                <li>Đính kèm mã đơn hoặc số điện thoại để tra cứu trạng thái giao hàng.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openFaq === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq((prev) => (prev === item.id ? null : item.id))}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                      <p className="text-xs uppercase tracking-[0.22em] text-brand-primary">Hỏi đáp</p>
                    </div>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold transition ${
                        isOpen
                          ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="px-5 pb-5 text-sm text-slate-600">
                      <p>{item.answer}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
