import React, { useState } from "react";

export default function AdminProducts() {
  const [imagePreview, setPreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  async function onFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("image", file);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/products/upload", {
      method: "POST",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
      body: fd,
    });
    const data = await res.json();
    setImageUrl(data.imageUrl || "");
  }

  async function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = Object.fromEntries(form.entries());
    if (imageUrl) payload.imageUrl = imageUrl;
    const token = localStorage.getItem("token");
    await fetch("/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });
    alert("Đã lưu (demo)");
  }

  return (
    <div>
      <h1>Quản lý sản phẩm</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <input name="name" placeholder="Tên sản phẩm" required />
        <input name="brand" placeholder="Hãng" required />
        <input name="price" type="number" placeholder="Giá" required />
        <input name="oldPrice" type="number" placeholder="Giá cũ" />
        <textarea name="description" placeholder="Mô tả ngắn" />
        <input type="file" accept="image/*" onChange={onFile} />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Xem trước"
            style={{ maxWidth: 240, border: "1px solid #1f2937", borderRadius: 8 }}
          />
        )}
        <button>Lưu sản phẩm</button>
      </form>
    </div>
  );
}
