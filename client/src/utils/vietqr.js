const BANK_BIN = import.meta.env.VITE_VIETQR_BANK_BIN || "970436";
const ACCOUNT_NO = import.meta.env.VITE_VIETQR_ACCOUNT_NO || "1014252931";
const TEMPLATE_ID = import.meta.env.VITE_VIETQR_TEMPLATE_ID || "dgq67g5";
const ACCOUNT_NAME = import.meta.env.VITE_VIETQR_ACCOUNT_NAME || "";
const DEFAULT_AMOUNT = Number(import.meta.env.VITE_VIETQR_DEFAULT_AMOUNT || 20000);
const DEFAULT_ADDINFO = import.meta.env.VITE_VIETQR_DEFAULT_ADDINFO || "Test Order";

const BASE_IMAGE = `https://api.vietqr.io/image/${BANK_BIN}-${ACCOUNT_NO}-${TEMPLATE_ID}.jpg`;

const resolveBaseUrl = () => {
  const raw = import.meta.env.VITE_VIETQR_QUICK_LINK;
  if (typeof raw === "string" && raw.trim()) {
    try {
      return new URL(raw.trim()).toString();
    } catch {
      // ignore invalid custom url
    }
  }
  return BASE_IMAGE;
};

const DEFAULT_QUICK_LINK = resolveBaseUrl();

const stripAccents = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s\-_.]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const sanitizeAddInfo = (value = "") => {
  const cleaned = stripAccents(value);
  return cleaned || DEFAULT_ADDINFO;
};

const sanitizeAccountName = (value = "") => stripAccents(value).slice(0, 50);

export const buildVietqrImageUrl = ({ amount, description, baseUrl } = {}) => {
  let url;
  try {
    const candidate =
      typeof baseUrl === "string" && baseUrl.trim() ? baseUrl.trim() : DEFAULT_QUICK_LINK;
    url = new URL(candidate);
  } catch {
    url = new URL(BASE_IMAGE);
  }

  const rawAmount = Number(amount);
  const numericAmount = Number.isFinite(rawAmount) ? rawAmount : DEFAULT_AMOUNT;
  const safeAmount = Math.max(0, Math.round(numericAmount));

  url.searchParams.set("amount", String(safeAmount));
  url.searchParams.set("addInfo", sanitizeAddInfo(description));

  if (ACCOUNT_NAME.trim()) {
    url.searchParams.set("accountName", sanitizeAccountName(ACCOUNT_NAME));
  }

  return url.toString();
};

export const DEFAULT_VIETQR_URL = buildVietqrImageUrl({
  amount: DEFAULT_AMOUNT,
  description: DEFAULT_ADDINFO,
});
