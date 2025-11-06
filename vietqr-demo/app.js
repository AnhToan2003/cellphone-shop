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
      :root { color-scheme: light dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f8fafc;
        color: #0f172a;
      }
      .page {
        max-width: 640px;
        margin: 0 auto;
        padding: 32px 20px 48px;
      }
      h1 {
        margin: 0 0 16px;
        font-size: 30px;
        font-weight: 700;
      }
      p.description {
        margin: 0 0 32px;
        color: #475569;
        line-height: 1.6;
      }
      form {
        display: grid;
        gap: 16px;
        background: #ffffff;
        padding: 28px;
        border-radius: 24px;
        box-shadow: 0 18px 40px -30px rgba(15, 23, 42, 0.6);
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
        border-radius: 14px;
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
        border-radius: 999px;
        background: linear-gradient(135deg, #0ea5e9, #2563eb);
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 14px 32px -24px #2563eb;
      }
      button.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 44px -26px #2563eb;
      }
      .card {
        margin-top: 24px;
        background: #ffffff;
        padding: 28px;
        border-radius: 24px;
        box-shadow: 0 18px 40px -30px rgba(15, 23, 42, 0.6);
      }
      .qr-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 24px;
        background: #f1f5f9;
        border-radius: 24px;
        border: 1px dashed rgba(148, 163, 184, 0.4);
        margin: 20px 0;
      }
      .qr-wrapper img {
        width: 260px;
        height: 260px;
        object-fit: contain;
        border-radius: 18px;
        background: #ffffff;
        padding: 16px;
      }
      .info-list {
        display: grid;
        gap: 12px;
        margin-bottom: 24px;
      }
      .info-list span {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 16px;
        background: #f8fafc;
        border-radius: 16px;
        border: 1px solid rgba(148, 163, 184, 0.25);
      }
      .info-list strong {
        font-weight: 600;
        color: #1e293b;
      }
      .confirm-btn {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        border: none;
        padding: 14px 20px;
        border-radius: 999px;
        font-size: 16px;
        font-weight: 600;
        background: linear-gradient(135deg, #16a34a, #22c55e);
        color: #ffffff;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 18px 40px -28px #16a34a;
      }
      .confirm-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 24px 50px -30px #16a34a;
      }
      a.back-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #2563eb;
        font-weight: 600;
        margin-bottom: 20px;
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

  return sendHtml(
    res,
    TEXT.payTitle,
    `<a class="back-link" href="${escapeHtml(returnUrl)}">&larr; ${TEXT.backLink}</a>
      <div class="card">
        <h2>${TEXT.payHeading}</h2>
        <p>${TEXT.payDescription}</p>
        <div class="qr-wrapper">
          <img src="${qrUrl}" alt="${TEXT.payTitle}" />
        </div>
        <div class="info-list">
          <span><strong>${TEXT.itemsLabel}</strong> ${formatCurrency(itemsAmount)}</span>
          <span><strong>${TEXT.shippingLabel}</strong> ${formatCurrency(shippingAmount)}</span>
          <span><strong>${TEXT.totalLabel}</strong> ${formatCurrency(total)}</span>
          <span><strong>${TEXT.bankLabel}</strong> ${VIETQR.bankName}</span>
          <span><strong>${TEXT.accountLabel}</strong> ${VIETQR.accountName}</span>
          <span><strong>${TEXT.accountNoLabel}</strong> ${VIETQR.accountNo}</span>
          <span><strong>${TEXT.contentLabel}</strong> ${addInfo || TEXT.noRequirementLabel}</span>
        </div>
        <button
          class="confirm-btn"
          type="button"
          id="confirm-btn"
          data-return-url="${escapeHtml(returnUrl)}"
        >
          ${TEXT.confirmButton}
        </button>
        <script>
        (function () {
          const btn = document.getElementById("confirm-btn");
          if (!btn) return;

          const normalizeUrl = (value) => {
            if (typeof value !== "string") return "/";
            const trimmed = value.trim();
            if (!trimmed) return "/";
            if (/^https?:\\/\\/|^\\//.test(trimmed)) {
              return trimmed;
            }
            return "/";
          };

          const targetUrl = normalizeUrl(btn.dataset.returnUrl);
          const redirectText = ${JSON.stringify(TEXT.redirectingText)};

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
        })();
        </script>
      </div>`
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
