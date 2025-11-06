import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
  uploadAdminProductImage,
} from "../../services/api.js";
import { getAssetUrl } from "../../utils/assets.js";

const initialForm = {
  name: "",
  brand: "",
  price: "",
  oldPrice: "",
  stock: "",
  description: "",
  warrantyPolicy: "",
  warrantyMonths: "12",
  imageUrl: "",
  colors: "",
  capacities: "",
};

const normalizeKeyPart = (value) =>
  value === null || value === undefined ? "" : value.toString().trim();

const buildVariantKey = (color, capacity) =>
  `${normalizeKeyPart(color)}__${normalizeKeyPart(capacity)}`;

const splitInputList = (value = "") => {
  const items = value
    .toString()
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(items));
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [variantPrices, setVariantPrices] = useState({});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const { data } = await fetchAdminProducts({ limit: 100 });
      setProducts(data.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const colorList = useMemo(
    () => splitInputList(form.colors),
    [form.colors]
  );
  const capacityList = useMemo(
    () => splitInputList(form.capacities),
    [form.capacities]
  );

  const variantMatrix = useMemo(() => {
    const colors = colorList.length ? colorList : [""];
    const capacities = capacityList.length ? capacityList : [""];

    if (
      colors.length === 1 &&
      colors[0] === "" &&
      capacities.length === 1 &&
      capacities[0] === ""
    ) {
      return [];
    }

    const combos = [];
    colors.forEach((color) => {
      capacities.forEach((capacity) => {
        combos.push({
          color,
          capacity,
          key: buildVariantKey(color, capacity),
        });
      });
    });
    return combos;
  }, [colorList, capacityList]);

  useEffect(() => {
    if (!variantMatrix.length) {
      setVariantPrices((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }

    const defaultPrice =
      form.price !== undefined && form.price !== null && form.price !== ""
        ? String(form.price)
        : "";

    setVariantPrices((prev) => {
      const next = {};
      let changed = false;

      variantMatrix.forEach(({ key }) => {
        if (Object.prototype.hasOwnProperty.call(prev, key)) {
          next[key] = prev[key];
        } else {
          next[key] = defaultPrice;
          changed = true;
        }
      });

      Object.keys(prev).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(next, key)) {
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [variantMatrix, form.price]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVariantPriceChange = (key, value) => {
    const sanitized = value.replace(/[^\d]/g, "");
    setVariantPrices((prev) => ({
      ...prev,
      [key]: sanitized,
    }));
  };

  const handleFileChange = (event) => {
    const [selected] = event.target.files;
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setFile(selected || null);
    setPreview(selected ? URL.createObjectURL(selected) : null);
    setForm((prev) => ({
      ...prev,
      imageUrl: "",
    }));
  };

  const resetForm = () => {
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setForm({ ...initialForm });
    setVariantPrices({});
    setFile(null);
    setPreview(null);
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    const currentImage =
      product.imageUrl ||
      (Array.isArray(product.images) ? product.images[0] : "") ||
      "";
    const colors = Array.isArray(product.options?.colors)
      ? product.options.colors.join(", ")
      : "";
    const capacities = Array.isArray(product.options?.capacities)
      ? product.options.capacities.join(", ")
      : "";

    setForm({
      name: product.name || "",
      brand: product.brand || "",
      price: product.price ?? "",
      oldPrice: product.oldPrice ?? "",
      stock: product.stock ?? "",
      description: product.description || "",
      warrantyPolicy: product.warrantyPolicy || "",
      warrantyMonths:
        product.warrantyMonths !== undefined && product.warrantyMonths !== null
          ? String(product.warrantyMonths)
          : "12",
      imageUrl: currentImage,
      colors,
      capacities,
    });

    const variantMap = {};
    if (Array.isArray(product.variants)) {
      product.variants.forEach((variant) => {
        const key = buildVariantKey(
          variant?.color || "",
          variant?.capacity || ""
        );
        variantMap[key] =
          variant?.price !== undefined && variant?.price !== null
            ? String(variant.price)
            : "";
      });
    }
    setVariantPrices(variantMap);
    setFile(null);
    setPreview(currentImage ? getAssetUrl(currentImage) : null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name || !form.brand || !form.price) {
      toast.error("Vui lòng nhập đầy đủ tên, thương hiệu và giá bán");
      return;
    }

    const normalizedWarrantyMonths =
      form.warrantyMonths === "" ? 12 : Number(form.warrantyMonths);
    if (
      !Number.isFinite(normalizedWarrantyMonths) ||
      normalizedWarrantyMonths <= 0
    ) {
      toast.error("Vui lòng nhập thời hạn bảo hành hợp lệ (tháng).");
      return;
    }

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
      stock: form.stock ? Number(form.stock) : undefined,
      description: form.description ? form.description.trim() : "",
      warrantyPolicy: form.warrantyPolicy
        ? form.warrantyPolicy.trim()
        : "",
      warrantyMonths: normalizedWarrantyMonths,
      options: {
        colors: colorList,
        capacities: capacityList,
      },
    };

    try {
      setIsSubmitting(true);
      let uploadedImageUrl = form.imageUrl;

      if (file) {
        const formData = new FormData();
        formData.append("image", file);
        const { data } = await uploadAdminProductImage(formData);
        uploadedImageUrl = data.imageUrl;
      }

      if (uploadedImageUrl) {
        payload.imageUrl = uploadedImageUrl;
      }

      const baseVariantPrice = Number(form.price);
      if (!Number.isFinite(baseVariantPrice) || baseVariantPrice < 0) {
        toast.error("Vui lòng nhập giá bán hợp lệ.");
        setIsSubmitting(false);
        return;
      }

      if (variantMatrix.length) {
        const variantPayload = variantMatrix.map(({ key, color, capacity }) => {
          const rawValue = variantPrices[key];
          const priceValue =
            rawValue === undefined || rawValue === ""
              ? baseVariantPrice
              : Number(rawValue);
          return {
            color,
            capacity,
            price: priceValue,
          };
        });

        const invalidVariant = variantPayload.find(
          (variant) => !Number.isFinite(variant.price) || variant.price < 0
        );

        if (invalidVariant) {
          toast.error("Vui lòng nhập giá hợp lệ cho tất cả biến thể.");
          setIsSubmitting(false);
          return;
        }

        payload.variants = variantPayload;
      } else if (editingId) {
        payload.variants = [];
      }

      if (editingId) {
        await updateAdminProduct(editingId, payload);
        toast.success("Cập nhật sản phẩm thành công");
      } else {
        await createAdminProduct(payload);
        toast.success("Thêm sản phẩm mới thành công");
      }

      resetForm();
      await loadProducts();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Không thể lưu sản phẩm";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xoá sản phẩm "${product.name}"?`
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product._id);
      await deleteAdminProduct(product._id);
      toast.success("Đã xoá sản phẩm");
      await loadProducts();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể xoá sản phẩm");
    } finally {
      setDeletingId(null);
    }
  };

  const inventoryValue = useMemo(
    () =>
      products.reduce(
        (sum, product) =>
          sum + (product.finalPrice ?? product.price ?? 0) * (product.stock ?? 0),
        0
      ),
    [products]
  );

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
          Sản phẩm
        </p>
        <h1 className="text-3xl font-semibold text-white">Quản lý sản phẩm</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Tạo mới, chỉnh sửa thông tin và cập nhật tồn kho sản phẩm. Bạn có thể thêm màu
          sắc, dung lượng cùng tải lên hình ảnh trực tiếp tại đây.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {variantMatrix.length > 0 && (
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-300">Giá theo biến thể</p>
                <span className="text-xs text-slate-500">
                  Để trống sẽ dùng giá gốc {Number(form.price || 0).toLocaleString("vi-VN")}₫
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                  <thead className="bg-slate-900/60 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Màu sắc</th>
                      <th className="px-4 py-2 text-left">Dung lượng</th>
                      <th className="px-4 py-2 text-left">Giá bán (₫)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {variantMatrix.map(({ key, color, capacity }) => (
                      <tr key={key} className="hover:bg-slate-900/60">
                        <td className="px-4 py-3">{color || "Mặc định"}</td>
                        <td className="px-4 py-3">{capacity || "Mặc định"}</td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={variantPrices[key] ?? ""}
                            onChange={(event) =>
                              handleVariantPriceChange(key, event.target.value)
                            }
                            placeholder={form.price ? String(form.price) : "0"}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="name">
              Tên sản phẩm
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
              placeholder="Ví dụ: iPhone 15 Pro Max 256GB"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="brand">
              Thương hiệu
            </label>
            <input
              id="brand"
              name="brand"
              value={form.brand}
              onChange={handleChange}
              required
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
              placeholder="Chọn thương hiệu"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="price">
              Giá bán
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={handleChange}
              required
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
              placeholder="Nhập giá bán"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="oldPrice">
              Giá niêm yết (tuỳ chọn)
            </label>
            <input
              id="oldPrice"
              name="oldPrice"
              type="number"
              min="0"
              value={form.oldPrice}
              onChange={handleChange}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
              placeholder="Nhập giá niêm yết"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="stock">
              Tồn kho
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
              placeholder="Nhập số lượng trong kho"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="colors">
              Màu sắc (cách nhau bằng dấu phẩy)
            </label>
            <input
              id="colors"
              name="colors"
              value={form.colors}
              onChange={handleChange}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
              placeholder="Đen, Trắng, Titan Xanh..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="capacities">
              Dung lượng (cách nhau bằng dấu phẩy)
            </label>
            <input
              id="capacities"
              name="capacities"
              value={form.capacities}
              onChange={handleChange}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
              placeholder="128GB, 256GB, 512GB..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="description">
              Mô tả sản phẩm
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
              placeholder="Nêu bật tính năng chính, ưu điểm của sản phẩm..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="warrantyMonths">
              Thời hạn bảo hành (tháng)
            </label>
            <input
              id="warrantyMonths"
              name="warrantyMonths"
              type="number"
              min={1}
              max={60}
              value={form.warrantyMonths}
              onChange={handleChange}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
              placeholder="Ví dụ: 12"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="warrantyPolicy">
              Chính sách bảo hành chi tiết
            </label>
            <textarea
              id="warrantyPolicy"
              name="warrantyPolicy"
              value={form.warrantyPolicy}
              onChange={handleChange}
              rows={3}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
              placeholder="Mô tả điều kiện bảo hành, thời gian đổi mới, các trường hợp không áp dụng..."
            />
            <p className="text-xs text-slate-500">
              Nội dung này sẽ hiển thị cho khách hàng trong trang chi tiết sản phẩm và mục bảo hành.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr,auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="image">
                Hình ảnh sản phẩm
              </label>
              <input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="w-full rounded-xl border border-dashed border-slate-700 px-4 py-3 text-sm text-slate-300 outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-brand-primary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
              />
            </div>
            {(preview || form.imageUrl) && (
              <div className="flex items-center justify-center">
                <img
                  src={preview || getAssetUrl(form.imageUrl)}
                  alt={form.name || "Product preview"}
                  className="h-32 w-32 rounded-xl border border-slate-700 object-cover"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-slate-600 px-6 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              Huỷ chỉnh sửa
            </button>
          )}
          <div className="flex flex-1 justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand-dark/50"
            >
              {isSubmitting
                ? editingId
                  ? "Đang cập nhật..."
                  : "Đang thêm sản phẩm..."
                : editingId
                ? "Cập nhật sản phẩm"
                : "Thêm sản phẩm"}
            </button>
          </div>
        </div>
      </form>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Danh sách sản phẩm</h2>
            <p className="text-sm text-slate-400">
              Giá trị tồn kho: {formatCurrency(inventoryValue)}
            </p>
          </div>
          <span className="rounded-full border border-slate-700 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
            {products.length} sản phẩm
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Thương hiệu</th>
                <th className="px-4 py-3 text-right">Giá bán</th>
                <th className="px-4 py-3 text-right">Tồn kho</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-slate-800" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded bg-slate-800" />
                          <div className="h-3 w-20 rounded bg-slate-800" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-16 rounded bg-slate-800" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="ml-auto h-4 w-16 rounded bg-slate-800" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="ml-auto h-4 w-12 rounded bg-slate-800" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="ml-auto h-8 w-16 rounded-full bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : products.length ? (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-900/70">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            getAssetUrl(product.imageUrl || product.images?.[0]) ||
                            "https://placehold.co/64x64?text=No+Image"
                          }
                          alt={product.name}
                          className="h-14 w-14 rounded-xl border border-slate-800 object-cover"
                        />
                        <div>
                          <p className="font-semibold text-white">{product.name}</p>
                          <p className="text-xs text-slate-500">#{product._id?.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {product.brand || "Không rõ"}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-100">
                      {formatCurrency(product.finalPrice ?? product.price ?? 0)}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-400">
                      {product.stock ?? 0}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          disabled={isSubmitting || deletingId === product._id}
                          className="rounded-full border border-brand-primary/60 px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          disabled={deletingId === product._id}
                          className="rounded-full border border-red-500/60 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === product._id ? "Đang xoá..." : "Xoá"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    Không có sản phẩm nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ManageProducts;
