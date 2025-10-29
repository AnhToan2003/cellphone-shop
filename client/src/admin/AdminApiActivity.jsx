import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { clearActivities } from "../store/slices/apiActivitySlice.js";

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const toRelativeUrl = (url) => {
  if (!url) return "";
  try {
    const parsed = new URL(url, window.location.origin);
    return `${parsed.pathname}${parsed.search}`;
  } catch (error) {
    return url;
  }
};

const truncate = (value, max = 160) => {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
};

const statusTone = (status) => {
  if (!status) return { bg: "#1e293b", color: "#f8fafc" };
  if (status >= 200 && status < 300) {
    return { bg: "#0f766e", color: "#f0fdfa" };
  }
  if (status >= 400) {
    return { bg: "#b91c1c", color: "#fee2e2" };
  }
  return { bg: "#334155", color: "#e2e8f0" };
};

const ActivityRow = ({ item }) => {
  const relativeUrl = toRelativeUrl(item.url);
  const time = timeFormatter.format(new Date(item.time));
  const tone = statusTone(item.status);
  const note = item.error ? "Lỗi" : "Thành công";

  return (
    <tr>
      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{time}</td>
      <td style={{ padding: "10px 12px" }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 13,
            color: "#e2e8f0",
          }}
        >
          {item.method} {relativeUrl}
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{note}</div>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 48,
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            padding: "4px 10px",
            background: tone.bg,
            color: tone.color,
          }}
        >
          {item.status ?? "-"}
        </span>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "right" }}>
        {item.durationMs} ms
      </td>
      <td style={{ padding: "10px 12px" }}>
        <details>
          <summary style={{ cursor: "pointer" }}>Xem chi tiết</summary>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Yêu cầu</div>
            <pre
              style={{
                background: "#0f172a",
                borderRadius: 8,
                padding: 8,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 12,
                color: "#e2e8f0",
              }}
            >
              {truncate(item.requestBody || "(trống)")}
            </pre>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
              Phản hồi / Lỗi
            </div>
            <pre
              style={{
                background: "#0f172a",
                borderRadius: 8,
                padding: 8,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 12,
                color: "#e2e8f0",
              }}
            >
              {truncate(item.error ?? item.responseBody ?? "(trống)")}
            </pre>
          </div>
        </details>
      </td>
    </tr>
  );
};

const AdminApiActivity = () => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.apiActivity.items);
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    if (!keyword) return items;
    const lower = keyword.toLowerCase();
    return items.filter((item) => {
      const snapshot = `${item.method} ${item.url} ${item.status}`.toLowerCase();
      return snapshot.includes(lower);
    });
  }, [items, keyword]);

  return (
    <div style={{ color: "#e2e8f0" }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
        Hoạt động API
      </h2>
      <p style={{ color: "#94a3b8", marginBottom: 16 }}>
        Theo dõi các request và response gần đây của ứng dụng.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Lọc theo GET, POST hoặc đường dẫn"
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 10,
            border: "1px solid #1e293b",
            background: "#0f172a",
            color: "#e2e8f0",
          }}
        />
        <button
          type="button"
          onClick={() => dispatch(clearActivities())}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "1px solid #f87171",
            background: "transparent",
            color: "#f87171",
            cursor: "pointer",
          }}
        >
          Xóa lịch sử
        </button>
      </div>
      <div style={{ overflow: "auto", borderRadius: 16, border: "1px solid #1e293b" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#0f172a", textAlign: "left" }}>
            <tr>
              <th style={{ padding: "10px 12px" }}>Thời gian</th>
              <th style={{ padding: "10px 12px" }}>Sự kiện</th>
              <th style={{ padding: "10px 12px", textAlign: "center" }}>Trạng thái</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>Độ trễ</th>
              <th style={{ padding: "10px 12px" }}>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                  Không có hoạt động nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminApiActivity;
