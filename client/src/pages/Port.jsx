import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HiOutlineSearch } from "react-icons/hi";
import { FiChevronDown, FiTrash2 } from "react-icons/fi";

import {
  clearActivities,
  setActivities,
} from "../store/slices/apiActivitySlice.js";
import {
  clearMonitorActivity,
  fetchMonitorActivity,
} from "../services/monitor.js";
import BackButton from "../components/BackButton.jsx";

const METHOD_FILTERS = ["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"];
const STATUS_FILTERS = [
  { value: "ALL", label: "Tất cả" },
  { value: "SUCCESS", label: "2xx" },
  { value: "ERROR", label: "4xx/5xx" },
  { value: "PENDING", label: "Pending" },
];

const METHOD_COLORS = {
  GET: "bg-emerald-500/20 border-emerald-400/40 text-emerald-100",
  POST: "bg-sky-500/20 border-sky-400/40 text-sky-100",
  PUT: "bg-indigo-500/20 border-indigo-400/40 text-indigo-100",
  PATCH: "bg-purple-500/20 border-purple-400/40 text-purple-100",
  DELETE: "bg-rose-500/20 border-rose-400/40 text-rose-100",
  DEFAULT: "bg-slate-800 border-slate-600/40 text-slate-200",
};

const STATUS_COLORS = {
  success: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  error: "border-rose-400/40 bg-rose-500/10 text-rose-200",
  warning: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  neutral: "border-slate-600/50 bg-slate-800 text-slate-200",
};

const getBaseOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "http://localhost";

const formatTimestamp = (value) => {
  if (!value) return "Chưa xác định";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const relativeUrl = (url) => {
  if (!url) return "/";
  try {
    const parsed = new URL(url, getBaseOrigin());
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
};

const extractQueryParams = (url) => {
  if (!url) return [];
  try {
    const parsed = new URL(url, getBaseOrigin());
    return Array.from(parsed.searchParams.entries());
  } catch {
    return [];
  }
};

const normalizePath = (path) => {
  if (!path) return "/";
  const clean = path.split("?")[0] || "/";
  return clean.startsWith("/") ? clean : `/${clean}`;
};

const deriveCategoryKey = (path) => {
  const segments = path.split("/").filter(Boolean);
  if (!segments.length) return "general";
  if (segments[0].toLowerCase() === "api" && segments[1]) {
    return segments[1].toLowerCase();
  }
  return segments[0].toLowerCase();
};

const formatCategoryLabel = (key) => {
  if (!key) return "General";
  return key
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const deriveResourceName = (path) => {
  const segments = path.split("/").filter(Boolean);
  if (!segments.length) return "root";
  const candidates = segments.filter((segment) => !segment.startsWith(":"));
  const last = candidates[candidates.length - 1] || segments[segments.length - 1];
  return last.replace(/[:{}]/g, "");
};

const buildOperationLabel = (method, resourceName) => {
  const map = {
    GET: "Truy xuất",
    POST: "Tạo mới",
    PUT: "Cập nhật",
    PATCH: "Điều chỉnh",
    DELETE: "Xóa",
  };
  const action = map[method] || "Thao tác";
  return `${action} ${resourceName}`;
};

const tryParseJson = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const summarizeDataShape = (value) => {
  const parsed = tryParseJson(value);
  if (parsed === null) {
    if (!value) return "Không có dữ liệu";
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return `Văn bản: ${text.slice(0, 160)}${text.length > 160 ? "…" : ""}`;
  }
  if (Array.isArray(parsed)) {
    const length = parsed.length;
    const sample = parsed[0];
    if (sample && typeof sample === "object" && !Array.isArray(sample)) {
      const keys = Object.keys(sample);
      return `Mảng ${length} phần tử • Trường: ${keys
        .slice(0, 6)
        .join(", ")}${keys.length > 6 ? "…" : ""}`;
    }
    return `Mảng ${length} phần tử`;
  }
  if (typeof parsed === "object") {
    const keys = Object.keys(parsed);
    return `Đối tượng: ${keys.slice(0, 8).join(", ")}${
      keys.length > 8 ? "…" : ""
    }`;
  }
  return `Giá trị: ${String(parsed).slice(0, 160)}`;
};

const renderQuerySummary = (entries = []) => {
  if (!entries.length) return "Không có tham số";
  return entries.map(([key, value]) => `${key}=${value || "(trống)"}`).join(", ");
};

const describeStatus = (status) => {
  if (!status) {
    return { tone: STATUS_COLORS.neutral, label: "PENDING" };
  }
  if (status >= 200 && status < 300) {
    return { tone: STATUS_COLORS.success, label: `${status} • SUCCESS` };
  }
  if (status >= 500) {
    return { tone: STATUS_COLORS.error, label: `${status} • SERVER ERROR` };
  }
  if (status >= 400) {
    return { tone: STATUS_COLORS.warning, label: `${status} • CLIENT ERROR` };
  }
  return { tone: STATUS_COLORS.neutral, label: `${status}` };
};

const normalizePayload = (value) => {
  if (!value) return "(empty)";
  try {
    if (typeof value === "string") {
      return JSON.stringify(JSON.parse(value), null, 2);
    }
    return JSON.stringify(value, null, 2);
  } catch {
    return value;
  }
};

const PortActivity = () => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.apiActivity.items);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [collapsedSections, setCollapsedSections] = useState(() => new Set());
  const [syncError, setSyncError] = useState(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const syncActivities = useCallback(async () => {
    try {
      const data = await fetchMonitorActivity();
      dispatch(setActivities(data));
      setSyncError(null);
      setLastSyncedAt(new Date());
    } catch (error) {
      setSyncError(error?.message || "Không thể đồng bộ hoạt động");
    }
  }, [dispatch]);

  useEffect(() => {
    let mounted = true;
    const runSync = async () => {
      if (!mounted) return;
      await syncActivities();
    };
    runSync();
    const interval = setInterval(runSync, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [syncActivities]);

  const normalizedItems = useMemo(
    () =>
      items.map((item) => {
        const url = relativeUrl(item.url);
        const path = normalizePath(url);
        const categoryKey = deriveCategoryKey(path);
        const resourceName = deriveResourceName(path);
        return {
          id: item.id,
          method: (item.method || "GET").toUpperCase(),
          path,
          status: item.status,
          duration: item.durationMs ?? 0,
          time: item.time,
          url,
          categoryKey,
          categoryLabel: formatCategoryLabel(categoryKey),
          resourceName,
          queryParams: extractQueryParams(item.url),
          requestBody: item.requestBody,
          responseBody: item.responseBody,
          error: item.error,
        };
      }),
    [items]
  );

  const stats = useMemo(() => {
    if (!normalizedItems.length) {
      return {
        total: 0,
        success: 0,
        errors: 0,
        avgDuration: 0,
        uniqueEndpoints: 0,
        lastActivity: null,
      };
    }
    let success = 0;
    let errors = 0;
    let durationSum = 0;
    const endpoints = new Set();
    let lastActivity = null;
    normalizedItems.forEach((item) => {
      if (item.status >= 200 && item.status < 300) success += 1;
      else if (item.status >= 400 || item.status === undefined) errors += 1;
      durationSum += item.duration;
      endpoints.add(`${item.method}:${item.path}`);
      if (!lastActivity || (item.time || "") > lastActivity) {
        lastActivity = item.time;
      }
    });
    return {
      total: normalizedItems.length,
      success,
      errors,
      avgDuration: Math.round(durationSum / normalizedItems.length) || 0,
      uniqueEndpoints: endpoints.size,
      lastActivity,
    };
  }, [normalizedItems]);

  const catalogGroups = useMemo(() => {
    const endpointMap = new Map();
    normalizedItems.forEach((item) => {
      const key = `${item.method}:${item.path}`;
      if (!endpointMap.has(key)) {
        endpointMap.set(key, {
          key,
          method: item.method,
          path: item.path,
          categoryKey: item.categoryKey,
          categoryLabel: item.categoryLabel,
          resourceName: item.resourceName,
          hits: 0,
          success: 0,
          errors: 0,
          totalDuration: 0,
          lastStatus: null,
          lastTime: null,
          sampleRequest: null,
          sampleResponse: null,
          sampleQuery: [],
          requestSummary: "Không có dữ liệu",
          responseSummary: "Không có dữ liệu",
          operationLabel: buildOperationLabel(item.method, item.resourceName),
        });
      }
      const endpoint = endpointMap.get(key);
      endpoint.hits += 1;
      endpoint.totalDuration += item.duration;
      endpoint.sampleRequest = item.requestBody;
      endpoint.sampleResponse = item.error ?? item.responseBody;
      endpoint.sampleQuery = item.queryParams;
      endpoint.requestSummary = summarizeDataShape(item.requestBody);
      endpoint.responseSummary = summarizeDataShape(
        item.error ?? item.responseBody
      );
      if (!endpoint.lastTime || (item.time || "") > endpoint.lastTime) {
        endpoint.lastTime = item.time;
        endpoint.lastStatus = item.status;
      }
      if (item.status >= 200 && item.status < 300) endpoint.success += 1;
      else if (item.status) endpoint.errors += 1;
    });

    const byCategory = new Map();
    endpointMap.forEach((endpoint) => {
      const avgDuration = Math.round(
        endpoint.totalDuration / Math.max(1, endpoint.hits)
      );
      const successRate = endpoint.hits
        ? Math.round((endpoint.success / endpoint.hits) * 100)
        : 0;
      if (!byCategory.has(endpoint.categoryKey)) {
        byCategory.set(endpoint.categoryKey, {
          key: endpoint.categoryKey,
          label: endpoint.categoryLabel,
          endpoints: [],
        });
      }
      byCategory.get(endpoint.categoryKey).endpoints.push({
        ...endpoint,
        avgDuration,
        successRate,
      });
    });

    return Array.from(byCategory.values())
      .map((group) => ({
        ...group,
        endpoints: group.endpoints.sort((a, b) => a.path.localeCompare(b.path)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [normalizedItems]);

  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return normalizedItems.filter((item) => {
      if (methodFilter !== "ALL" && item.method !== methodFilter) {
        return false;
      }
      if (
        statusFilter === "SUCCESS" &&
        !(item.status >= 200 && item.status < 300)
      ) {
        return false;
      }
      if (statusFilter === "ERROR" && !(item.status >= 400)) {
        return false;
      }
      if (statusFilter === "PENDING" && item.status) {
        return false;
      }
      if (!keyword) return true;
      const haystack = [
        item.method,
        item.path,
        item.status,
        item.requestBody,
        item.responseBody,
        item.error,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [normalizedItems, search, methodFilter, statusFilter]);

  const activityGroups = useMemo(() => {
    const grouped = new Map();
    visibleItems.forEach((item) => {
      if (!grouped.has(item.categoryKey)) {
        grouped.set(item.categoryKey, {
          key: item.categoryKey,
          label: item.categoryLabel || "General",
          endpoints: [],
        });
      }
      grouped.get(item.categoryKey).endpoints.push(item);
    });
    return Array.from(grouped.values())
      .map((group) => {
        const sorted = group.endpoints.sort((a, b) => {
          const pathCompare = a.path.localeCompare(b.path);
          if (pathCompare !== 0) return pathCompare;
          return (b.time || "").localeCompare(a.time || "");
        });
        const lastActivity = sorted.reduce(
          (latest, item) =>
            !latest || (item.time || "") > latest ? item.time : latest,
          null
        );
        return { ...group, endpoints: sorted, lastActivity };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [visibleItems]);

  const toggleSection = (key) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-900 bg-slate-900/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-400">
              Port Monitor
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              API Catalogue Viewer
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {lastSyncedAt
                ? `Đồng bộ lúc ${formatTimestamp(lastSyncedAt)}`
                : "Đang chuẩn bị dữ liệu..."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-emerald-500/20 px-4 py-1 text-sm font-semibold text-emerald-200">
              Live feed
            </span>
            <button
              type="button"
              onClick={async () => {
                setIsManualSyncing(true);
                await syncActivities();
                setIsManualSyncing(false);
              }}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/70 disabled:opacity-50"
              disabled={isManualSyncing}
            >
              {isManualSyncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsManualSyncing(true);
                try {
                  await clearMonitorActivity();
                  dispatch(clearActivities());
                } finally {
                  setIsManualSyncing(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-50"
              disabled={isManualSyncing}
            >
              <FiTrash2 />
              Xóa log
            </button>
          </div>
        </div>
      </header>

      <BackButton
        fallback="/"
        variant="dark"
        iconSize={14}
        alwaysVisible
        wrapperClassName="mx-auto flex max-w-6xl px-6 pt-4"
        className="border-slate-800 bg-slate-900/70 text-slate-100"
      />

      {syncError && (
        <div className="mx-auto mt-4 max-w-6xl rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {syncError}
        </div>
      )}

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mt-2 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Tổng request"
            value={stats.total}
            sub={`Cập nhật ${formatTimestamp(stats.lastActivity)}`}
          />
          <StatCard
            label="Thành công"
            value={stats.success}
            sub={`${stats.total ? Math.round((stats.success / stats.total) * 100) : 0}%`}
          />
          <StatCard
            label="Lỗi / Pending"
            value={stats.errors}
            sub="Bao gồm 4xx/5xx và request chưa có trạng thái"
          />
          <StatCard
            label="Độ trễ trung bình"
            value={`${stats.avgDuration} ms`}
            sub={`${stats.uniqueEndpoints} endpoint riêng biệt`}
          />
        </div>

        <section className="mt-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Danh mục API theo chức năng
              </h2>
              <p className="text-sm text-slate-500">
                Mỗi mục đại diện cho một chức năng GET / POST / PUT / DELETE cụ
                thể, mô tả rõ dữ liệu của API.
              </p>
            </div>
            <span className="text-sm text-slate-400">
              {catalogGroups.reduce(
                (total, group) => total + group.endpoints.length,
                0
              )}{" "}
              chức năng
            </span>
          </div>

          {!catalogGroups.length && (
            <div className="rounded-2xl border border-slate-900 bg-slate-900/40 px-6 py-10 text-center text-sm text-slate-500">
              Chưa ghi nhận chức năng nào.
            </div>
          )}

          {catalogGroups.map((group) => {
            const sectionKey = `catalog-${group.key}`;
            const isCollapsed = collapsedSections.has(sectionKey);
            return (
              <section
                key={group.key}
                className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/50"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(sectionKey)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {group.label}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      {group.endpoints.length} chức năng
                    </p>
                  </div>
                  <FiChevronDown
                    className={`text-slate-400 transition ${
                      isCollapsed ? "" : "rotate-180"
                    }`}
                    size={20}
                  />
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-slate-900">
                    {group.endpoints.map((endpoint) => {
                      const statusTone = describeStatus(endpoint.lastStatus);
                      return (
                        <details key={endpoint.key} className="group" defaultOpen>
                          <summary className="flex cursor-pointer flex-wrap items-center gap-4 px-6 py-4 text-sm text-slate-200">
                            <span
                              className={`rounded-md border px-3 py-1 font-semibold ${
                                METHOD_COLORS[endpoint.method] ||
                                METHOD_COLORS.DEFAULT
                              }`}
                            >
                              {endpoint.method}
                            </span>
                            <span className="flex-1 font-mono text-base text-slate-100">
                              {endpoint.path}
                            </span>
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
                                {endpoint.hits} lần gọi
                              </span>
                              <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
                                Thành công {endpoint.successRate}%
                              </span>
                              <span
                                className={`rounded-full border px-3 py-1 font-semibold ${statusTone.tone}`}
                              >
                                Gần nhất: {statusTone.label}
                              </span>
                            </div>
                          </summary>
                          <div className="grid gap-4 border-t border-slate-900 bg-slate-950/70 px-6 py-5 text-sm md:grid-cols-2">
                            <div>
                              <p className="text-xs uppercase tracking-widest text-slate-500">
                                Thông tin chuyên sâu
                              </p>
                              <div className="mt-2 space-y-1 text-slate-200">
                                <p>
                                  <span className="text-slate-500">
                                    Chức năng:
                                  </span>{" "}
                                  {endpoint.operationLabel}
                                </p>
                                <p>
                                  <span className="text-slate-500">
                                    Tài nguyên:
                                  </span>{" "}
                                  {endpoint.resourceName}
                                </p>
                                <p>
                                  <span className="text-slate-500">
                                    Lần cuối:
                                  </span>{" "}
                                  {formatTimestamp(endpoint.lastTime)}
                                </p>
                                <p>
                                  <span className="text-slate-500">
                                    Thời gian TB:
                                  </span>{" "}
                                  {endpoint.avgDuration} ms
                                </p>
                                <p>
                                  <span className="text-slate-500">
                                    Lỗi ghi nhận:
                                  </span>{" "}
                                  {endpoint.errors}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-widest text-slate-500">
                                Query gần nhất
                              </p>
                              <p className="mt-2 rounded-xl border border-slate-900 bg-slate-950 p-3 text-xs text-slate-200">
                                {renderQuerySummary(endpoint.sampleQuery)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-widest text-slate-500">
                                Cấu trúc request
                              </p>
                              <p className="mt-2 text-xs text-slate-400">
                                {endpoint.requestSummary}
                              </p>
                              <pre className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-900 bg-slate-950 p-4 text-xs text-slate-200">
                                {normalizePayload(endpoint.sampleRequest)}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-widest text-slate-500">
                                Cấu trúc response
                              </p>
                              <p className="mt-2 text-xs text-slate-400">
                                {endpoint.responseSummary}
                              </p>
                              <pre className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-900 bg-slate-950 p-4 text-xs text-slate-200">
                                {normalizePayload(endpoint.sampleResponse)}
                              </pre>
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Dòng thời gian hoạt động
              </h2>
              <p className="text-sm text-slate-500">
                Theo dõi từng request gần nhất với bộ lọc linh hoạt.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm">
            <HiOutlineSearch className="text-slate-500" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Lọc theo phương thức, đường dẫn hoặc mã phản hồi..."
              className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </label>
          <p className="text-sm text-slate-500">
            Hiển thị {visibleItems.length} bản ghi
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {METHOD_FILTERS.map((method) => (
            <FilterChip
              key={method}
              active={methodFilter === method}
              onClick={() => setMethodFilter(method)}
            >
              {method}
            </FilterChip>
          ))}
          {STATUS_FILTERS.map((option) => (
            <FilterChip
              key={option.value}
              active={statusFilter === option.value}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </FilterChip>
          ))}
        </div>

        <div className="mt-8 space-y-6">
          {!activityGroups.length && (
            <div className="rounded-2xl border border-slate-900 bg-slate-900/40 px-6 py-10 text-center text-sm text-slate-500">
              Chưa có hoạt động nào khớp với bộ lọc hiện tại.
            </div>
          )}

          {activityGroups.map((group) => {
            const sectionKey = `activity-${group.key}`;
            const isCollapsed = collapsedSections.has(sectionKey);
            return (
              <section
                key={group.key}
                className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/50"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(sectionKey)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {group.label}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      {group.endpoints.length} bản ghi • Cập nhật{" "}
                      {formatTimestamp(group.lastActivity)}
                    </p>
                  </div>
                  <FiChevronDown
                    className={`text-slate-400 transition ${
                      isCollapsed ? "" : "rotate-180"
                    }`}
                    size={20}
                  />
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-slate-900">
                    {group.endpoints.map((endpoint) => {
                      const statusTone = describeStatus(endpoint.status);
                      return (
                        <details key={endpoint.id} className="group" defaultOpen>
                          <summary className="flex cursor-pointer items-center gap-4 px-6 py-4 text-sm text-slate-200">
                            <span
                              className={`rounded-md border px-3 py-1 font-semibold ${
                                METHOD_COLORS[endpoint.method] ||
                                METHOD_COLORS.DEFAULT
                              }`}
                            >
                              {endpoint.method}
                            </span>
                            <span className="flex-1 font-mono text-base text-slate-100">
                              {endpoint.path}
                            </span>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone.tone}`}
                            >
                              {statusTone.label}
                            </span>
                          </summary>
                          <div className="grid gap-4 border-t border-slate-900 bg-slate-950/70 px-6 py-5 text-sm md:grid-cols-2">
                            <div>
                              <p className="text-xs uppercase tracking-widest text-slate-500">
                                Thời gian
                              </p>
                              <p className="mt-1 text-white">
                                {formatTimestamp(endpoint.time)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-widest text-slate-500">
                                Độ trễ
                              </p>
                              <p className="mt-1 text-white">
                                {endpoint.duration} ms
                              </p>
                            </div>
                            <div className="md:col-span-1">
                              <p className="text-xs uppercase tracking-widest text-slate-500">
                                Request body
                              </p>
                              <pre className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-900 bg-slate-950 p-4 text-xs text-slate-200">
                                {normalizePayload(endpoint.requestBody)}
                              </pre>
                            </div>
                            <div className="md:col-span-1">
                              <p className="text-xs uppercase tracking-widest text-slate-500">
                                Response / Error
                              </p>
                              <pre className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-900 bg-slate-950 p-4 text-xs text-slate-200">
                                {normalizePayload(
                                  endpoint.error ?? endpoint.responseBody
                                )}
                              </pre>
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
};

const FilterChip = ({ children, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
      active
        ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
        : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:text-white"
    }`}
  >
    {children}
  </button>
);

const StatCard = ({ label, value, sub }) => (
  <div className="rounded-2xl border border-slate-900 bg-slate-900/60 p-4">
    <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    <p className="text-xs text-slate-500">{sub}</p>
  </div>
);

export default PortActivity;
