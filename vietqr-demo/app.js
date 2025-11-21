import express from "express";

const app = express();
const PORT = process.env.PORT || 5500;

const VIETQR = {
  acqId: "970436",
  accountNo: "1014252931",
  templateId: "dgq67g5",
  bankName: "Vietcombank",
  accountName: "B\u00D9I NGUY\u1EC4N ANH TO\u00C0N",
};

const SHIPPING_FEE = 30000;
const DEFAULT_RETURN_URL = "/";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const TEXT = {
  checkoutTitle: "Thanh to\u00E1n VietQR",
  checkoutDescription:
    "Nh\u1EADp gi\u00E1 tr\u1ECB \u0111\u01A1n h\u00E0ng v\u00E0 (t\u00F9y ch\u1ECDn) n\u1ED9i dung chuy\u1EC3n kho\u1EA3n \u0111\u1EC3 t\u1EA1o m\u00E3 VietQR.",
  amountLabel: "S\u1ED1 ti\u1EC1n (VND) *",
  amountPlaceholder: "V\u00ED d\u1EE5: 1200000",
  transferLabel: "N\u1ED9i dung chuy\u1EC3n kho\u1EA3n (t\u00F9y ch\u1ECDn)",
  transferPlaceholder: "V\u00ED d\u1EE5: ORDER-12345",
  submitButton: "\u0110\u1EB7t h\u00E0ng",
  amountErrorTitle: "L\u1ED7i s\u1ED1 ti\u1EC1n",
  backLink: "Quay l\u1EA1i",
  amountErrorHeading: "S\u1ED1 ti\u1EC1n kh\u00F4ng h\u1EE3p l\u1EC7",
  amountErrorMessage: "Vui l\u00F2ng nh\u1EADp s\u1ED1 ti\u1EC1n l\u1EDBn h\u01A1n 0.",
  missingInfoTitle: "Thi\u1EBFu th\u00F4ng tin \u0111\u01A1n h\u00E0ng",
  missingInfoHeading: "Thi\u1EBFu th\u00F4ng tin thanh to\u00E1n",
  missingInfoMessage:
    "Vui l\u00F2ng quay l\u1EA1i b\u01B0\u1EDBc tr\u01B0\u1EDBc \u0111\u1EC3 nh\u1EADp s\u1ED1 ti\u1EC1n.",
  payTitle: "Qu\u00E9t m\u00E3 VietQR",
  payHeading: "Qu\u00E9t m\u00E3 VietQR \u0111\u1EC3 thanh to\u00E1n",
  payDescription:
    "Vui l\u00F2ng s\u1EED d\u1EE5ng \u1EE9ng d\u1EE5ng ng\u00E2n h\u00E0ng \u0111\u1EC3 qu\u00E9t m\u00E3 d\u01B0\u1EDBi \u0111\u00E2y v\u00E0 ho\u00E0n t\u1EA5t chuy\u1EC3n kho\u1EA3n.",
  payEyebrow: "THANH TO\u00C1N QUA VIETQR",
  orderFallback: "\u0110\u01A1n h\u00E0ng VietQR",
  supportedAppsLabel: "\u1EE8ng d\u1EE5ng h\u1ED7 tr\u1EE3",
  supportedAppsDescription:
    "Ch\u1ECDn logo ng\u00E2n h\u00E0ng \u0111\u1EC3 m\u1EDF \u1EE9ng d\u1EE5ng thanh to\u00E1n v\u00E0 qu\u00E9t m\u00E3.",
  transferFeeLabel: "Ph\u00ED chuy\u1EC3n kho\u1EA3n",
  summaryNote:
    "Sau khi chuy\u1EC3n kho\u1EA3n th\u00E0nh c\u00F4ng, nh\u1EA5n n\u00FAt x\u00E1c nh\u1EADn \u0111\u1EC3 quay l\u1EA1i c\u1EEDa h\u00E0ng.",
  secondaryAction: "Quay v\u1EC1 trang x\u00E1c nh\u1EADn",
  quickLinkLabel: "Li\u00EAn k\u1EBFt nhanh",
  copyLabel: "Sao ch\u00E9p",
  copySuccess: "\u0110\u00E3 sao ch\u00E9p!",
  bankSectionTitle: "Th\u00F4ng tin t\u00E0i kho\u1EA3n",
  itemsLabel: "Gi\u00E1 tr\u1ECB \u0111\u01A1n h\u00E0ng",
  shippingLabel: "Ph\u00ED v\u1EADn chuy\u1EC3n",
  totalLabel: "T\u1ED5ng thanh to\u00E1n",
  bankLabel: "Ng\u00E2n h\u00E0ng",
  accountLabel: "Ch\u1EE7 t\u00E0i kho\u1EA3n",
  accountNoLabel: "S\u1ED1 t\u00E0i kho\u1EA3n",
  contentLabel: "N\u1ED9i dung chuy\u1EC3n kho\u1EA3n",
  noRequirementLabel: "(Kh\u00F4ng y\u00EAu c\u1EA7u)",
  confirmButton: "T\u00F4i \u0111\u00E3 chuy\u1EC3n kho\u1EA3n",
  redirectingText: "\u0110ang chuy\u1EC3n h\u01B0\u1EDBng...",
  confirmMessage: "\u0110\u00E3 x\u00E1c nh\u1EADn thanh to\u00E1n (demo)",
  notFoundTitle: "Kh\u00F4ng t\u00ECm th\u1EA5y trang",
  returnLink: "Tr\u1EDF l\u1EA1i",
  notFoundHeading: "Kh\u00F4ng t\u00ECm th\u1EA5y n\u1ED9i dung",
  notFoundMessage:
    "\u0110\u01B0\u1EDDng d\u1EABn b\u1EA1n truy c\u1EADp hi\u1EC7n kh\u00F4ng t\u1ED3n t\u1EA1i.",
};

const SUPPORTED_APPS = ["ACB", "BIDV", "Techcombank", "MB Bank", "Vietcombank", "VPBank"];

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const layout = (title, body) => `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      :root {
        color-scheme: light;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #eef2ff;
        color: #0f172a;
      }
      .page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px 20px 72px;
      }
      h1 {
        margin: 0 0 16px;
        font-size: 32px;
        font-weight: 700;
      }
      p.description {
        margin: 0 auto 32px;
        color: #475569;
        line-height: 1.6;
        max-width: 560px;
      }
      form {
        display: grid;
        gap: 16px;
        background: #ffffff;
        padding: 32px;
        border-radius: 28px;
        box-shadow: 0 30px 80px -60px rgba(15, 23, 42, 0.7);
        max-width: 560px;
        margin: 0 auto;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-weight: 600;
        color: #1e293b;
      }
      input[type="number"],
      input[type="text"] {
        border: 1px solid rgba(148, 163, 184, 0.4);
        border-radius: 16px;
        padding: 12px 16px;
        font-size: 15px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      input:focus {
        outline: none;
        border-color: #38bdf8;
        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
      }
      button.primary {
        margin-top: 12px;
        border: none;
        padding: 14px 20px;
        border-radius: 16px;
        background: linear-gradient(135deg, #0ea5e9, #2563eb);
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 20px 50px -35px #2563eb;
      }
      button.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 26px 60px -34px #2563eb;
      }
      .card {
        margin-top: 24px;
        background: #ffffff;
        padding: 28px;
        border-radius: 24px;
        box-shadow: 0 24px 70px -55px rgba(15, 23, 42, 0.6);
      }
      a.back-link,
      .hero-back {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #0369a1;
        font-weight: 600;
        text-decoration: none;
        margin-bottom: 20px;
      }
      .payment-shell {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .payment-hero {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        justify-content: space-between;
        background: linear-gradient(135deg, #14b8a6, #0ea5e9);
        color: #ffffff;
        border-radius: 32px;
        padding: 32px;
        box-shadow: 0 38px 110px -60px rgba(14, 165, 233, 0.6);
      }
      .hero-eyebrow {
        font-size: 12px;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        opacity: 0.8;
        margin-bottom: 8px;
        display: block;
      }
      .payment-hero h1 {
        margin: 0 0 8px;
        font-size: 34px;
        color: #ffffff;
      }
      .payment-hero p {
        margin: 0;
        color: rgba(255, 255, 255, 0.9);
        line-height: 1.5;
      }
      .hero-total {
        margin-left: auto;
        min-width: 220px;
        background: rgba(15, 23, 42, 0.25);
        border-radius: 24px;
        padding: 18px 24px;
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .hero-total span {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        opacity: 0.8;
      }
      .hero-total strong {
        font-size: 28px;
      }
      .fee-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.18);
        font-size: 13px;
        font-weight: 600;
        margin-top: 12px;
      }
      .payment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 24px;
      }
      .panel {
        background: #ffffff;
        border-radius: 28px;
        padding: 28px;
        box-shadow: 0 34px 90px -60px rgba(15, 23, 42, 0.45);
      }
      .panel + .panel {
        margin-top: 20px;
      }
      .panel h3 {
        margin: 0 0 16px;
        font-size: 18px;
        color: #0f172a;
      }
      .qr-panel {
        text-align: center;
        padding: 32px 24px;
      }
      .qr-panel img {
        width: 280px;
        max-width: 100%;
        border-radius: 24px;
        background: #ffffff;
        padding: 16px;
        border: 1px dashed rgba(148, 163, 184, 0.4);
        box-shadow: 0 18px 50px -35px rgba(15, 23, 42, 0.5);
      }
      .scan-tip {
        margin: 18px auto 0;
        color: #475569;
        font-size: 15px;
      }
      .bank-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .bank-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 16px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        border-radius: 18px;
        background: #f8fafc;
      }
      .bank-row strong {
        display: block;
        font-size: 12px;
        color: #64748b;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .bank-row-value {
        font-size: 16px;
        font-weight: 600;
        color: #0f172a;
        margin: 2px 0 0;
      }
      .copy-btn {
        border: none;
        background: #0ea5e9;
        color: #ffffff;
        padding: 10px 16px;
        border-radius: 999px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
        white-space: nowrap;
      }
      .copy-btn:hover {
        background: #0284c7;
        transform: translateY(-1px);
      }
      .copy-btn.copied {
        background: #16a34a;
      }
      .panel p {
        margin: 0;
      }
      .app-grid {
        margin-top: 20px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .app-pill {
        border: 1px solid rgba(148, 163, 184, 0.35);
        border-radius: 16px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        color: #0f172a;
        background: #f8fafc;
      }
      .app-pill-letter {
        width: 32px;
        height: 32px;
        border-radius: 12px;
        background: #e0f2fe;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: #0369a1;
      }
      .summary-rows {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 8px;
        border-bottom: 1px dashed rgba(148, 163, 184, 0.4);
      }
      .summary-row span {
        font-weight: 500;
        color: #475569;
      }
      .summary-row strong {
        font-size: 16px;
        color: #0f172a;
      }
      .summary-total {
        font-size: 20px;
        color: #16a34a;
      }
      .note {
        background: #f0fdf4;
        border: 1px solid rgba(34, 197, 94, 0.25);
        border-radius: 18px;
        padding: 12px 16px;
        font-size: 14px;
        color: #166534;
        line-height: 1.5;
        margin: 16px 0;
      }
      .cta-primary {
        width: 100%;
        border: none;
        padding: 16px 20px;
        border-radius: 18px;
        font-size: 16px;
        font-weight: 600;
        background: linear-gradient(135deg, #16a34a, #22c55e);
        color: #ffffff;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 26px 60px -40px #16a34a;
      }
      .cta-primary:hover:not(:disabled) {
        transform: translateY(-1px);
      }
      .cta-primary:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }
      .cta-secondary {
        margin-top: 12px;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 14px 20px;
        border-radius: 16px;
        border: 1px solid rgba(148, 163, 184, 0.5);
        font-weight: 600;
        color: #0f172a;
        text-decoration: none;
        background: #ffffff;
      }
      .quick-link {
        margin-top: 16px;
        font-size: 13px;
        color: #475569;
        word-break: break-all;
      }
      .quick-link strong {
        display: block;
        margin-bottom: 4px;
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #94a3b8;
      }
      .quick-link a {
        color: #0369a1;
        text-decoration: none;
      }
      @media (max-width: 768px) {
        .payment-hero {
          padding: 24px;
        }
        .hero-total {
          width: 100%;
          text-align: left;
          align-items: flex-start;
        }
        .app-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      ${body}
    </div>
  </body>
</html>`;

const sendHtml = (res, title, body, status = 200) => {
  res.status(status);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(Buffer.from(layout(title, body), "utf8"));
};

const buildQrImage = (amount, addInfo) => {
  const { acqId, accountNo, templateId } = VIETQR;
  return `https://api.vietqr.io/image/${acqId}-${accountNo}-${templateId}.jpg?amount=${encodeURIComponent(
    amount
  )}&addInfo=${encodeURIComponent(addInfo)}`;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const sanitizeReturnUrl = (value) => {
  if (typeof value !== "string") return DEFAULT_RETURN_URL;
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_RETURN_URL;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  return DEFAULT_RETURN_URL;
};

const normalizeAmount = (value, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    const fallbackNumeric = Number(fallback);
    if (Number.isFinite(fallbackNumeric) && fallbackNumeric > 0) {
      return Math.max(0, Math.round(fallbackNumeric));
    }
    return 0;
  }
  if (numeric < 0) {
    return 0;
  }
  return Math.round(numeric);
};

app.get("/checkout", (req, res) => {
  const returnUrl = sanitizeReturnUrl(req.query.returnUrl);

  return sendHtml(
    res,
    TEXT.checkoutTitle,
    `<h1>${TEXT.checkoutTitle}</h1>
      <p class="description">
        ${TEXT.checkoutDescription}
      </p>
      <form action="/redirect" method="POST">
        <label>
          ${TEXT.amountLabel}
          <input type="number" name="amount" min="1" required placeholder="${TEXT.amountPlaceholder}" />
        </label>
        <label>
          ${TEXT.transferLabel}
          <input type="text" name="addInfo" placeholder="${TEXT.transferPlaceholder}" />
        </label>
        <input type="hidden" name="returnUrl" value="${escapeHtml(returnUrl)}" />
        <button type="submit" class="primary">${TEXT.submitButton}</button>
      </form>`
  );
});

app.post("/redirect", (req, res) => {
  const amountRaw = req.body?.amount;
  const addInfoRaw = req.body?.addInfo;
  const returnUrlRaw = req.body?.returnUrl;

  const itemsAmount = normalizeAmount(amountRaw, 0);
  if (itemsAmount <= 0) {
    return sendHtml(
      res,
      TEXT.amountErrorTitle,
      `<a class="back-link" href="/checkout">&larr; ${TEXT.backLink}</a>
        <div class="card">
          <h2>${TEXT.amountErrorHeading}</h2>
          <p>${TEXT.amountErrorMessage}</p>
        </div>`,
      400
    );
  }

  const shippingAmount = SHIPPING_FEE;
  const total = itemsAmount + shippingAmount;
  const addInfo =
    typeof addInfoRaw === "string" && addInfoRaw.trim()
      ? addInfoRaw.trim()
      : `ORDER-${Date.now()}`;
  const returnUrl = sanitizeReturnUrl(returnUrlRaw);

  res.redirect(
    `/pay?items=${encodeURIComponent(
      itemsAmount
    )}&shipping=${encodeURIComponent(
      shippingAmount
    )}&total=${encodeURIComponent(total)}&addInfo=${encodeURIComponent(
      addInfo
    )}&returnUrl=${encodeURIComponent(returnUrl)}`
  );
});

app.get("/pay", (req, res) => {
  const totalRaw = req.query.total;
  const addInfoRaw = req.query.addInfo;
  const returnUrlRaw = req.query.returnUrl;
  const itemsRaw = req.query.items;
  const shippingRaw = req.query.shipping;

  let itemsAmount = normalizeAmount(itemsRaw, 0);
  let shippingAmount = normalizeAmount(shippingRaw, SHIPPING_FEE);
  if (shippingAmount < SHIPPING_FEE) {
    shippingAmount = SHIPPING_FEE;
  }
  let total = normalizeAmount(totalRaw, itemsAmount + shippingAmount);

  if (itemsAmount + shippingAmount > 0) {
    total = itemsAmount + shippingAmount;
  }

  if (total <= 0) {
    return sendHtml(
      res,
      TEXT.missingInfoTitle,
      `<a class="back-link" href="/checkout">&larr; ${TEXT.backLink}</a>
        <div class="card">
          <h2>${TEXT.missingInfoHeading}</h2>
          <p>${TEXT.missingInfoMessage}</p>
        </div>`,
      400
    );
  }

  if (itemsAmount <= 0) {
    itemsAmount = Math.max(0, total - shippingAmount);
  }

  if (total < SHIPPING_FEE) {
    total = SHIPPING_FEE;
  }

  shippingAmount = Math.min(total, Math.max(SHIPPING_FEE, shippingAmount));
  if (itemsAmount + shippingAmount !== total) {
    itemsAmount = Math.max(0, total - shippingAmount);
    shippingAmount = Math.min(total, Math.max(SHIPPING_FEE, total - itemsAmount));
  }

  const addInfo = typeof addInfoRaw === "string" && addInfoRaw.trim() ? addInfoRaw.trim() : "";
  const qrUrl = buildQrImage(total, addInfo);
  const returnUrl = sanitizeReturnUrl(returnUrlRaw);
  const orderLabel = addInfo || TEXT.orderFallback;
  const safeOrderLabel = escapeHtml(orderLabel);
  const supportedAppsMarkup = SUPPORTED_APPS.map((app) => {
    const label = typeof app === "string" ? app.trim() : "";
    const display = label || String(app || "");
    const initial = display.charAt(0) || "•";
    return `<span class="app-pill"><span class="app-pill-letter">${escapeHtml(
      initial
    )}</span><span>${escapeHtml(display)}</span></span>`;
  }).join("");
  const feeDisplay = escapeHtml(formatCurrency(SHIPPING_FEE));
  const itemsDisplay = escapeHtml(formatCurrency(itemsAmount));
  const shippingDisplay = escapeHtml(formatCurrency(shippingAmount));
  const totalDisplay = escapeHtml(formatCurrency(total));
  const contentDisplay = escapeHtml(addInfo || TEXT.noRequirementLabel);
  const bankNameDisplay = escapeHtml(VIETQR.bankName);
  const accountNameDisplay = escapeHtml(VIETQR.accountName);
  const accountNoDisplay = escapeHtml(VIETQR.accountNo);
  const safeQrUrl = escapeHtml(qrUrl);
  const safeReturnUrl = escapeHtml(returnUrl);

  return sendHtml(
    res,
    TEXT.payTitle,
    `<a class="hero-back" href="${safeReturnUrl}">&larr; ${TEXT.backLink}</a>
      <div class="payment-shell">
        <div class="payment-hero">
          <div>
            <span class="hero-eyebrow">${TEXT.payEyebrow}</span>
            <h1>${safeOrderLabel}</h1>
            <p>${TEXT.payDescription}</p>
            <span class="fee-pill">${TEXT.transferFeeLabel}: ${feeDisplay}</span>
          </div>
          <div class="hero-total">
            <span>${TEXT.totalLabel}</span>
            <strong>${totalDisplay}</strong>
          </div>
        </div>
        <div class="payment-grid">
          <div class="payment-column">
            <section class="panel qr-panel">
              <img src="${safeQrUrl}" alt="${TEXT.payTitle}" />
              <p class="scan-tip">${TEXT.payHeading}</p>
            </section>
            <section class="panel">
              <h3>${TEXT.bankSectionTitle}</h3>
              <div class="bank-list">
                <div class="bank-row">
                  <div>
                    <strong>${TEXT.bankLabel}</strong>
                    <p class="bank-row-value">${bankNameDisplay}</p>
                  </div>
                  <button type="button" class="copy-btn" data-copy="${bankNameDisplay}">
                    ${TEXT.copyLabel}
                  </button>
                </div>
                <div class="bank-row">
                  <div>
                    <strong>${TEXT.accountLabel}</strong>
                    <p class="bank-row-value">${accountNameDisplay}</p>
                  </div>
                  <button type="button" class="copy-btn" data-copy="${accountNameDisplay}">
                    ${TEXT.copyLabel}
                  </button>
                </div>
                <div class="bank-row">
                  <div>
                    <strong>${TEXT.accountNoLabel}</strong>
                    <p class="bank-row-value">${accountNoDisplay}</p>
                  </div>
                  <button type="button" class="copy-btn" data-copy="${accountNoDisplay}">
                    ${TEXT.copyLabel}
                  </button>
                </div>
                <div class="bank-row">
                  <div>
                    <strong>${TEXT.totalLabel}</strong>
                    <p class="bank-row-value">${totalDisplay}</p>
                  </div>
                  <button type="button" class="copy-btn" data-copy="${totalDisplay}">
                    ${TEXT.copyLabel}
                  </button>
                </div>
                <div class="bank-row">
                  <div>
                    <strong>${TEXT.contentLabel}</strong>
                    <p class="bank-row-value">${contentDisplay}</p>
                  </div>
                  <button type="button" class="copy-btn" data-copy="${contentDisplay}">
                    ${TEXT.copyLabel}
                  </button>
                </div>
              </div>
            </section>
          </div>
          <div class="payment-column">
            <section class="panel">
              <h3>${TEXT.supportedAppsLabel}</h3>
              <p>${TEXT.supportedAppsDescription}</p>
              <div class="app-grid">
                ${supportedAppsMarkup}
              </div>
            </section>
            <section class="panel">
              <h3>${TEXT.totalLabel}</h3>
              <div class="summary-rows">
                <div class="summary-row">
                  <span>${TEXT.itemsLabel}</span>
                  <strong>${itemsDisplay}</strong>
                </div>
                <div class="summary-row">
                  <span>${TEXT.transferFeeLabel}</span>
                  <strong>${shippingDisplay}</strong>
                </div>
                <div class="summary-row">
                  <span>${TEXT.totalLabel}</span>
                  <strong class="summary-total">${totalDisplay}</strong>
                </div>
              </div>
              <div class="note">
                ${TEXT.summaryNote}
              </div>
              <button
                class="cta-primary"
                type="button"
                id="confirm-btn"
                data-return-url="${safeReturnUrl}"
              >
                ${TEXT.confirmButton}
              </button>
              <a class="cta-secondary" href="${safeReturnUrl}">
                ${TEXT.secondaryAction}
              </a>
              <div class="quick-link">
                <strong>${TEXT.quickLinkLabel}</strong>
                <a href="${safeQrUrl}" target="_blank" rel="noopener">${safeQrUrl}</a>
              </div>
            </section>
          </div>
        </div>
      </div>
      <script>
        (function () {
          const btn = document.getElementById("confirm-btn");

          const normalizeUrl = (value) => {
            if (typeof value !== "string") return "/";
            const trimmed = value.trim();
            if (!trimmed) return "/";
            if (/^https?:\\/\\/|^\\//.test(trimmed)) {
              return trimmed;
            }
            return "/";
          };

          const redirectText = ${JSON.stringify(TEXT.redirectingText)};
          if (btn) {
            const targetUrl = normalizeUrl(btn.dataset.returnUrl);
            const redirectTo = (url) => {
              if (window.opener && !window.opener.closed) {
                try {
                  window.opener.location.href = url;
                  window.close();
                  return;
                } catch {}
              }
              window.location.replace(url);
            };

            btn.addEventListener("click", () => {
              btn.disabled = true;
              btn.textContent = redirectText;
              redirectTo(targetUrl);
            });
          }

          const fallbackCopy = (value) => {
            const textarea = document.createElement("textarea");
            textarea.value = value;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "absolute";
            textarea.style.left = "-9999px";
            document.body.appendChild(textarea);
            textarea.select();
            try {
              document.execCommand("copy");
            } catch {}
            document.body.removeChild(textarea);
          };

          const copyLabel = ${JSON.stringify(TEXT.copyLabel)};
          const copySuccess = ${JSON.stringify(TEXT.copySuccess)};
          document.querySelectorAll("[data-copy]").forEach((button) => {
            button.addEventListener("click", () => {
              const value = button.getAttribute("data-copy") || "";
              const showCopied = () => {
                button.classList.add("copied");
                button.textContent = copySuccess;
                setTimeout(() => {
                  button.classList.remove("copied");
                  button.textContent = copyLabel;
                }, 1400);
              };

              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard
                  .writeText(value)
                  .then(showCopied)
                  .catch(() => {
                    fallbackCopy(value);
                    showCopied();
                  });
              } else {
                fallbackCopy(value);
                showCopied();
              }
            });
          });
        })();
      </script>`
  );
});

app.post("/api/confirm", (_req, res) => {
  res.json({ ok: true, message: TEXT.confirmMessage });
});

app.get("/", (req, res) => res.redirect("/checkout"));

app.use((req, res) => {
  return sendHtml(
    res,
    TEXT.notFoundTitle,
    `<a class="back-link" href="/checkout">&larr; ${TEXT.returnLink}</a>
      <div class="card">
        <h2>${TEXT.notFoundHeading}</h2>
        <p>${TEXT.notFoundMessage}</p>
      </div>`,
    404
  );
});

app.listen(PORT, () => {
  console.log(`VietQR checkout app is running at http://localhost:${PORT}`);
});
