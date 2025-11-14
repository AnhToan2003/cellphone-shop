const DEFAULT_BANK_BIN = process.env.VIETQR_BANK_BIN || "970436";
const DEFAULT_ACCOUNT_NO = process.env.VIETQR_ACCOUNT_NO || "1014252931";
const DEFAULT_TEMPLATE_ID = process.env.VIETQR_TEMPLATE_ID || "dgq67g5";

const DEFAULT_BASE_IMAGE = `https://api.vietqr.io/image/${DEFAULT_BANK_BIN}-${DEFAULT_ACCOUNT_NO}-${DEFAULT_TEMPLATE_ID}.jpg`;

const DEFAULT_AMOUNT = Number(process.env.VIETQR_DEFAULT_AMOUNT || 20000);
const DEFAULT_ADDINFO = process.env.VIETQR_DEFAULT_ADDINFO || "Test Order";

const FALLBACK_VIETQR_URL = `${DEFAULT_BASE_IMAGE}?amount=${DEFAULT_AMOUNT}&addInfo=${encodeURIComponent(
  DEFAULT_ADDINFO,
)}`;

const resolveBaseUrl = () => {
  const raw = process.env.VIETQR_QUICK_LINK;
  if (typeof raw === "string" && raw.trim()) {
    try {
      return new URL(raw.trim()).toString();
    } catch {
      // ignore invalid custom url
    }
  }
  return DEFAULT_BASE_IMAGE;
};

const DEFAULT_QUICK_LINK = resolveBaseUrl();

const normalizeSeed = (seed = "") =>
  typeof seed === "string"
    ? seed
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(-6)
    : "";

export const generateVietqrReference = (seed = "") => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000)
    .toString(36)
    .toUpperCase();

  return `DH${timestamp}${normalizeSeed(seed)}${random}`.slice(0, 18);
};

export const buildTransferContent = (reference) => {
  const code = reference || "DONHANG";
  return `Thanh toan don hang ${code}`;
};

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
  try {
    const candidate = baseUrl && baseUrl.trim() ? baseUrl.trim() : DEFAULT_QUICK_LINK;
    const url = new URL(candidate);
    const rawAmount = Number(amount);
    const numericAmount = Number.isFinite(rawAmount) ? rawAmount : DEFAULT_AMOUNT;
    const safeAmount = Math.max(0, Math.round(numericAmount));

    url.searchParams.set("amount", String(safeAmount));
    url.searchParams.set("addInfo", sanitizeAddInfo(description));

    const accountName = process.env.VIETQR_ACCOUNT_NAME;
    if (typeof accountName === "string" && accountName.trim()) {
      url.searchParams.set("accountName", sanitizeAccountName(accountName));
    }

    return url.toString();
  } catch {
    return FALLBACK_VIETQR_URL;
  }
};

export default {
  generateVietqrReference,
  buildTransferContent,
  buildVietqrImageUrl,
  DEFAULT_QUICK_LINK,
  FALLBACK_VIETQR_URL,
  DEFAULT_ADDINFO,
};

