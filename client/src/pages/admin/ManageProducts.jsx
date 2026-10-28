import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminBrands,
  fetchAdminProducts,
  fetchPublicCategories,
  updateAdminProduct,
  updateSpotlight,
  uploadAdminProductImage,
} from "../../services/api.js";
import { getAssetUrl } from "../../utils/assets.js";

const APPLE_CATEGORIES = [
  {
    name: "iPhone",
    subCategories: [
      "iPhone 16 Series",
      "iPhone 15 Series",
      "iPhone 14 Series",
      "iPhone 13 Series",
      "iPhone 12 & Cũ hơn",
    ],
  },
  {
    name: "iPad",
    subCategories: [
      "iPad Pro",
      "iPad Air",
      "iPad Gen 10 / Gen 9",
      "iPad Mini",
    ],
  },
  {
    name: "Mac",
    subCategories: [
      "MacBook Pro",
      "MacBook Air",
      "iMac",
      "Mac mini & Mac Studio",
    ],
  },
  {
    name: "Apple Watch",
    subCategories: [
      "Apple Watch Ultra",
      "Apple Watch Series",
      "Apple Watch SE",
    ],
  },
  {
    name: "Phụ kiện",
    subCategories: [
      "Tai nghe & AirPods",
      "Củ sạc & Cáp sạc",
      "Ốp lưng & Bao da",
      "Apple Pencil & Bàn phím",
    ],
  },
];

const initialForm = {
  name: "",
  brand: "Apple",
  category: "iPhone",
  subCategory: "iPhone 16 Series",
  price: "",
  oldPrice: "",
  stock: "",
  description: "",
  promotionsPolicy: "Tặng củ sạc nhanh Apple 20W USB-C chính hãng trị giá 490.000₫\nTặng ốp lưng MagSafe chống sốc & Dán cường lực KingKong cao cấp\nGiảm thêm 500.000₫ khi tham gia Thu cũ đổi mới (Trade-in)\nGiảm 20% khi mua kèm phụ kiện AirPods / Apple Watch\nHỗ trợ trả góp 0% lãi suất qua CCCD hoặc thẻ tín dụng",
  warrantyPolicy: "Bảo hành 12 tháng chính hãng tại Ngọc Triết Store.\nLỗi 1 đổi 1 trong 30 ngày đầu nếu phát sinh lỗi nhà sản xuất.\nMiễn phí vệ sinh máy & dán lại cường lực trọn đời.",
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
  const [gallery, setGallery] = useState([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [variantPrices, setVariantPrices] = useState({});
  const [variantImages, setVariantImages] = useState({});
  const [variantUploading, setVariantUploading] = useState({});
  const [colorImages, setColorImages] = useState({});
  const [colorUploading, setColorUploading] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [categories, setCategories] = useState(APPLE_CATEGORIES);
  const galleryInputRef = useRef(null);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const { data } = await fetchAdminProducts({ limit: 100 });
      setProducts(data.data || []);
    } catch {
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchPublicCategories();
        if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
          setCategories(res.data.data);
        }
      } catch {
        // keep fallback
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        setBrandsLoading(true);
        const response = await fetchAdminBrands();
        setBrands(
          Array.isArray(response.data?.data) ? response.data.data : []
        );
      } catch {
        toast.error("Không thể tải danh sách thương hiệu.");
      } finally {
        setBrandsLoading(false);
      }
    };

    loadBrands();
  }, []);

  const colorList = useMemo(
    () => splitInputList(form.colors),
    [form.colors]
  );
  const capacityList = useMemo(
    () => splitInputList(form.capacities),
    [form.capacities]
  );

  const currentCategoryData = useMemo(() => {
    return (
      categories.find(
        (cat) => cat.name.toLowerCase() === (form.category || "").toLowerCase()
      ) || categories[0] || APPLE_CATEGORIES[0]
    );
  }, [categories, form.category]);

  const brandOptions = useMemo(() => {
    const items = Array.isArray(brands) ? brands : [];
    if (form.brand) {
      const exists = items.some(
        (brand) =>
          (brand.name || "").toLowerCase() === form.brand.toLowerCase()
      );
      if (!exists) {
        return [...items, { _id: "custom-brand", name: form.brand }];
      }
    }
    return items;
  }, [brands, form.brand]);

  const sortedBrands = useMemo(
    () =>
      [...brandOptions].sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0);
        if (orderDiff !== 0) {
          return orderDiff;
        }
        return (a.name || "").localeCompare(b.name || "");
      }),
    [brandOptions]
  );

  const variantMatrix = useMemo(() => {
    const colors = colorList.length ? colorList : [""];
    const capacities = capacityList.length ? capacityList : [""];

    if (colors.length === 1 && colors[0] === "" && capacities.length === 1 && capacities[0] === "") {
      return [];
    }

    const combinations = [];
    colors.forEach((color) => {
      capacities.forEach((capacity) => {
        combinations.push({
          key: buildVariantKey(color, capacity),
          color,
          capacity,
        });
      });
    });

    return combinations;
  }, [colorList, capacityList]);

  useEffect(() => {
    if (!variantMatrix.length) {
      setVariantPrices((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }

    setVariantPrices((prev) => {
      const next = {};
      let changed = false;

      variantMatrix.forEach(({ key }) => {
        if (Object.prototype.hasOwnProperty.call(prev, key)) {
          next[key] = prev[key];
        } else {
          next[key] = form.price ? String(form.price) : "";
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

  useEffect(() => {
    if (!variantMatrix.length) {
      setVariantImages((prev) => (Object.keys(prev).length ? {} : prev));
      setVariantUploading({});
      return;
    }
    setVariantImages((prev) => {
      const next = {};
      let changed = false;
      variantMatrix.forEach(({ key, color }) => {
        if (Object.prototype.hasOwnProperty.call(prev, key) && prev[key]?.length) {
          next[key] = prev[key];
        } else {
          next[key] = (color && colorImages[color] && colorImages[color].length)
            ? [...colorImages[color]]
            : [];
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
  }, [variantMatrix, colorImages]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "category") {
        const cat = categories.find(
          (c) => c.name.toLowerCase() === value.toLowerCase()
        );
        next.subCategory = cat?.subCategories?.[0] || "";
      }
      return next;
    });
  };

  const handleVariantPriceChange = (key, value) => {
    const sanitized = value.replace(/[^\d]/g, "");
    setVariantPrices((prev) => ({
      ...prev,
      [key]: sanitized,
    }));
  };

  const handleSyncPriceToCapacity = (targetCapacity, price) => {
    if (!price) {
      toast.error("Vui lòng nhập giá trước khi áp dụng");
      return;
    }
    setVariantPrices((prev) => {
      const next = { ...prev };
      variantMatrix.forEach(({ key, capacity }) => {
        if (capacity === targetCapacity) {
          next[key] = price;
        }
      });
      return next;
    });
    toast.success(`Đã áp dụng giá ${Number(price).toLocaleString("vi-VN")}₫ cho toàn bộ ${targetCapacity}`);
  };

  const uploadImageFile = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await uploadAdminProductImage(formData);
    return data.imageUrl;
  };

  const handleGalleryUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setGalleryUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const url = await uploadImageFile(file);
        uploaded.push(url);
      }
      setGallery((prev) => [...prev, ...uploaded]);
      setForm((prev) => ({
        ...prev,
        imageUrl: prev.imageUrl || uploaded[0] || prev.imageUrl,
      }));
    } catch {
      toast.error("Không thể tải ảnh. Vui lòng thử lại.");
    } finally {
      setGalleryUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveGalleryImage = (index) => {
    setGallery((prev) => {
      const next = prev.filter((_, current) => current !== index);
      setForm((prevForm) => ({
        ...prevForm,
        imageUrl: next[0] || "",
      }));
      return next;
    });
  };

  const handleSetCoverImage = (index) => {
    setGallery((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const next = [...prev];
      const [selected] = next.splice(index, 1);
      next.unshift(selected);
      setForm((prevForm) => ({
        ...prevForm,
        imageUrl: selected || prevForm.imageUrl,
      }));
      return next;
    });
  };

  const handleVariantImageUpload = async (key, event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setVariantUploading((prev) => ({ ...prev, [key]: true }));
    try {
      const uploaded = [];
      for (const file of files) {
        const url = await uploadImageFile(file);
        uploaded.push(url);
      }
      setVariantImages((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), ...uploaded],
      }));
    } catch {
      toast.error("Không thể tải ảnh biến thể. Vui lòng thử lại.");
    } finally {
      setVariantUploading((prev) => ({ ...prev, [key]: false }));
      event.target.value = "";
    }
  };

  const handleRemoveVariantImage = (key, index) => {
    setVariantImages((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, current) => current !== index),
    }));
  };

  const handleColorImageUpload = async (color, event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setColorUploading((prev) => ({ ...prev, [color]: true }));
    try {
      const uploaded = [];
      for (const file of files) {
        const url = await uploadImageFile(file);
        uploaded.push(url);
      }
      setColorImages((prev) => ({
        ...prev,
        [color]: [...(prev[color] || []), ...uploaded],
      }));
      setVariantImages((prev) => {
        const next = { ...prev };
        variantMatrix.forEach(({ key, color: c }) => {
          if (c === color) {
            next[key] = [...(next[key] || []), ...uploaded];
          }
        });
        return next;
      });
      setGallery((prev) => (prev.length ? prev : [...uploaded]));
      toast.success(`Đã thêm ${uploaded.length} ảnh cho màu "${color}"`);
    } catch {
      toast.error("Không thể tải ảnh. Vui lòng thử lại.");
    } finally {
      setColorUploading((prev) => ({ ...prev, [color]: false }));
      event.target.value = "";
    }
  };

  const handleAddColorImageUrl = (color) => {
    const url = window.prompt(`Nhập liên kết (URL) ảnh cho màu "${color}":`);
    if (!url || !url.trim()) return;
    const cleanUrl = url.trim();
    setColorImages((prev) => ({
      ...prev,
      [color]: [...(prev[color] || []), cleanUrl],
    }));
    setVariantImages((prev) => {
      const next = { ...prev };
      variantMatrix.forEach(({ key, color: c }) => {
        if (c === color) {
          next[key] = [...(next[key] || []), cleanUrl];
        }
      });
      return next;
    });
    setGallery((prev) => (prev.length ? prev : [cleanUrl]));
  };

  const handleRemoveColorImage = (color, index) => {
    setColorImages((prev) => {
      const updated = (prev[color] || []).filter((_, idx) => idx !== index);
      setVariantImages((vPrev) => {
        const vNext = { ...vPrev };
        variantMatrix.forEach(({ key, color: c }) => {
          if (c === color) {
            vNext[key] = updated;
          }
        });
        return vNext;
      });
      return { ...prev, [color]: updated };
    });
  };

  const resetForm = () => {
    setForm({ ...initialForm });
    setGallery([]);
    setColorImages({});
    setColorUploading({});
    setVariantPrices({});
    setVariantImages({});
    setVariantUploading({});
    setEditingId(null);
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  };

  const handleToggleSpotlight = async (product) => {
    try {
      const isCurrentlyFeatured = Boolean(product.featured);
      const res = await updateSpotlight({
        productId: isCurrentlyFeatured ? null : product._id,
        title: isCurrentlyFeatured ? "" : product.name,
        description: isCurrentlyFeatured ? "" : (product.shortDescription || ""),
        isActive: !isCurrentlyFeatured,
      });
      if (res.data?.success) {
        toast.success(
          isCurrentlyFeatured
            ? `Đã hủy đặt nổi bật cho "${product.name}"`
            : `Đã đặt "${product.name}" làm sản phẩm nổi bật trang chủ!`
        );
        await loadProducts();
      }
    } catch {
      toast.error("Không thể cập nhật sản phẩm nổi bật");
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    const colors = Array.isArray(product.options?.colors)
      ? product.options.colors.join(", ")
      : "";
    const capacities = Array.isArray(product.options?.capacities)
      ? product.options.capacities.join(", ")
      : "";
    const existingGallery = Array.isArray(product.images)
      ? product.images.filter(Boolean)
      : [];
    const coverImage =
      existingGallery[0] ||
      product.imageUrl ||
      "";

    setForm({
      name: product.name || "",
      brand: product.brand || "Apple",
      category: product.category || "iPhone",
      subCategory: product.subCategory || "",
      price: product.price ?? "",
      oldPrice: product.oldPrice ?? "",
      stock: product.stock ?? "",
      description: product.description || "",
      promotionsPolicy: product.promotionsPolicy || "",
      warrantyPolicy: product.warrantyPolicy || "",
      warrantyMonths:
        product.warrantyMonths !== undefined && product.warrantyMonths !== null
          ? String(product.warrantyMonths)
          : "12",
      imageUrl: coverImage,
      colors,
      capacities,
    });

    setGallery(
      existingGallery.length ? existingGallery : coverImage ? [coverImage] : []
    );

    // Reconstruct colorImages
    const reconstructedColorImages = {};
    if (product.options?.colorImages && typeof product.options.colorImages === "object") {
      Object.entries(product.options.colorImages).forEach(([c, imgs]) => {
        if (Array.isArray(imgs)) {
          reconstructedColorImages[c] = imgs.filter(Boolean);
        }
      });
    }

    const variantPriceMap = {};
    const variantImageMap = {};
    if (Array.isArray(product.variants)) {
      product.variants.forEach((variant) => {
        const key = buildVariantKey(
          variant?.color || "",
          variant?.capacity || ""
        );
        variantPriceMap[key] =
          variant?.price !== undefined && variant?.price !== null
            ? String(variant.price)
            : "";
        const imgs = Array.isArray(variant?.images) ? variant.images.filter(Boolean) : [];
        variantImageMap[key] = imgs;
        if (variant.color && imgs.length > 0 && !reconstructedColorImages[variant.color]) {
          reconstructedColorImages[variant.color] = imgs;
        }
      });
    }
    setColorImages(reconstructedColorImages);
    setVariantPrices(variantPriceMap);
    setVariantImages(variantImageMap);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      brand: form.brand.trim() || "Apple",
      category: form.category?.trim() || "iPhone",
      subCategory: form.subCategory?.trim() || "",
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
      stock: form.stock ? Number(form.stock) : undefined,
      description: form.description ? form.description.trim() : "",
      promotionsPolicy: form.promotionsPolicy ? form.promotionsPolicy.trim() : "",
        warrantyPolicy: form.warrantyPolicy
        ? form.warrantyPolicy.trim()
        : "",
      warrantyMonths: normalizedWarrantyMonths,
      options: {
        colors: colorList,
        capacities: capacityList,
      },
    };

    let finalGallery = [...gallery];
    if (!finalGallery.length) {
      const allColorImgs = Object.values(colorImages).flat().filter(Boolean);
      if (allColorImgs.length) {
        finalGallery = allColorImgs;
      }
    }

    if (!finalGallery.length) {
      toast.error("Vui lòng tải ít nhất một hình ảnh sản phẩm hoặc ảnh màu sắc.");
      return;
    }

    try {
      setIsSubmitting(true);
      payload.imageUrl = finalGallery[0];
      payload.images = finalGallery;
      payload.options.colorImages = colorImages;

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
          const imagesForVariant =
            (variantImages[key] && variantImages[key].length > 0)
              ? variantImages[key]
              : (colorImages[color] && colorImages[color].length > 0)
              ? colorImages[color]
              : [];
          return {
            color,
            capacity,
            price: priceValue,
            images: imagesForVariant,
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
        <p className="text-xs uppercase tracking-[0.3em] text-blue-400 font-bold">
          Quản Trị Hệ Thống
        </p>
        <h1 className="text-3xl font-extrabold text-white">Quản lý sản phẩm Apple</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Thiết lập chi tiết sản phẩm, danh mục, giá bán và hệ thống màu sắc - dung lượng kèm ảnh riêng cho từng màu chuẩn xác.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {/* Tên sản phẩm */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="name">
              Tên sản phẩm <span className="text-rose-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              placeholder="Ví dụ: iPhone 16 Pro Max 256GB"
            />
          </div>

          {/* Thương hiệu */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="brand">
              Thương hiệu <span className="text-rose-500">*</span>
            </label>
            <select
              id="brand"
              name="brand"
              value={form.brand}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
            >
              <option value="">
                {brandsLoading
                  ? "Đang tải danh sách..."
                  : sortedBrands.length
                  ? "Chọn thương hiệu"
                  : "Chưa có thương hiệu, vui lòng tạo trước"}
              </option>
              {sortedBrands.map((brand) => (
                <option
                  key={brand._id || brand.slug || brand.name}
                  value={brand.name}
                >
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Danh mục chính */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300" htmlFor="category">
                Danh mục chính <span className="text-rose-500">*</span>
              </label>
              <Link
                to="/admin/categories"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
              >
                + Quản lý danh mục
              </Link>
            </div>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
            >
              {categories.map((cat) => (
                <option key={cat._id || cat.name} value={cat.name}>
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dòng sản phẩm / Danh mục con */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="subCategory">
              Dòng sản phẩm (Danh mục con)
            </label>
            <div className="flex gap-2">
              <select
                id="subCategory"
                name="subCategory"
                value={form.subCategory}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              >
                <option value="">-- Chọn dòng sản phẩm --</option>
                {(currentCategoryData?.subCategories || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Giá bán cơ bản */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="price">
              Giá bán cơ bản (₫) <span className="text-rose-500">*</span>
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              placeholder="34990000"
            />
          </div>

          {/* Giá niêm yết (cũ) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="oldPrice">
              Giá niêm yết (gốc để tính giảm giá)
            </label>
            <input
              id="oldPrice"
              name="oldPrice"
              type="number"
              min="0"
              value={form.oldPrice}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              placeholder="36990000"
            />
          </div>

          {/* Tồn kho */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="stock">
              Tồn kho tổng
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              placeholder="50"
            />
          </div>

          {/* Thời hạn bảo hành */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="warrantyMonths">
              Bảo hành (tháng)
            </label>
            <input
              id="warrantyMonths"
              name="warrantyMonths"
              type="number"
              min="1"
              max="60"
              value={form.warrantyMonths}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              placeholder="12"
            />
          </div>

          {/* Màu sắc */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="colors">
              Màu sắc (phân cách bằng dấu phẩy)
            </label>
            <input
              id="colors"
              name="colors"
              value={form.colors}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              placeholder="Titan Sa Mạc, Titan Tự Nhiên, Titan Đen, Titan Trắng"
            />
            <p className="text-xs text-slate-500">
              Nhập các màu sản phẩm có sẵn để hệ thống sinh bảng giá và ảnh riêng cho từng màu.
            </p>
          </div>

          {/* Dung lượng */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="capacities">
              Dung lượng (phân cách bằng dấu phẩy)
            </label>
            <input
              id="capacities"
              name="capacities"
              value={form.capacities}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              placeholder="128GB, 256GB, 512GB, 1TB"
            />
            <p className="text-xs text-slate-500">
              Để trống nếu sản phẩm không có tùy chọn dung lượng (phụ kiện, đồng hồ...).
            </p>
          </div>

                    {/* STUDIO QUẢN LÝ ẢNH THEO MÀU SẮC */}
          {colorList.length > 0 && (
            <div className="md:col-span-2 space-y-4 rounded-2xl border border-blue-500/40 bg-gradient-to-b from-blue-950/25 via-slate-900/60 to-slate-950 p-5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-ping" />
                    Studio Quản Lý Ảnh Theo Màu Sắc (Chuẩn Best Solution)
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Tải ảnh riêng cho từng màu tại đây. Thêm ảnh cho màu nào thì toàn bộ các dung lượng của màu đó đều tự động nhận ảnh đồng bộ!
                  </p>
                </div>
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-500/40">
                  {colorList.length} màu sắc
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                {colorList.map((color) => {
                  const images = colorImages[color] || [];
                  const isUploading = colorUploading[color];

                  return (
                    <div
                      key={color}
                      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/90 p-4 transition hover:border-blue-500/50"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-blue-400 border border-blue-600 shadow-sm" />
                            <span className="text-sm font-bold text-white">{color}</span>
                          </div>
                          <span className="text-xs font-semibold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-800/50">
                            {images.length} ảnh
                          </span>
                        </div>

                        {/* Thumbnails of this color */}
                        <div className="mt-3 flex flex-wrap gap-2 min-h-[56px]">
                          {images.length > 0 ? (
                            images.map((img, idx) => (
                              <div
                                key={`${img}-${idx}`}
                                className="group relative h-14 w-14 rounded-lg border border-slate-700 bg-slate-900 overflow-hidden"
                              >
                                <img
                                  src={getAssetUrl(img)}
                                  alt={`${color} ${idx + 1}`}
                                  className="h-full w-full object-cover"
                                />
                                {idx === 0 && (
                                  <span className="absolute bottom-0 inset-x-0 bg-blue-600 text-[9px] font-bold text-center text-white leading-tight py-0.5">
                                    Ảnh bìa
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColorImage(color, idx)}
                                  className="absolute inset-0 flex items-center justify-center bg-rose-950/85 text-white opacity-0 group-hover:opacity-100 transition text-xs font-bold"
                                  title="Xóa ảnh này khỏi màu"
                                >
                                  ✕
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs italic text-slate-500 py-3">
                              Chưa có ảnh riêng cho màu này. Hãy tải ảnh:
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Upload Buttons for this color */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                        <label
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-600/20 px-2.5 py-1.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-600/30 cursor-pointer ${
                            isUploading ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          <span>{isUploading ? "Đang tải..." : "+ Tải ảnh từ máy"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleColorImageUpload(color, e)}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => handleAddColorImageUrl(color)}
                          className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-500 transition"
                          title="Dán link URL ảnh"
                        >
                          + URL
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BẢNG QUẢN LÝ BIẾN THỂ (MÀU SẮC + DUNG LƯỢNG + ẢNH + GIÁ RIÊNG) */}
          {variantMatrix.length > 0 && (
            <div className="md:col-span-2 space-y-4 rounded-2xl border border-blue-500/30 bg-slate-950/80 p-5 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    Bảng Biến Thể Giá &amp; Tồn Kho Theo Dung Lượng
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tất cả dung lượng của cùng một màu sẽ tự động nhận ảnh từ Studio màu sắc phía trên. Bạn chỉ cần chỉnh giá bán theo từng dung lượng.
                  </p>
                </div>
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-500/30">
                  {variantMatrix.length} biến thể
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90">
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                  <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Màu sắc</th>
                      <th className="px-4 py-3 text-left">Dung lượng</th>
                      <th className="px-4 py-3 text-left">Giá bán (₫)</th>
                      <th className="px-4 py-3 text-left min-w-[240px]">Ảnh màu hiển thị</th>
                      <th className="px-4 py-3 text-right">Áp dụng giá nhanh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {variantMatrix.map(({ key, color, capacity }) => {
                      const colorImgs = colorImages[color] || [];
                      const images = (variantImages[key] && variantImages[key].length > 0)
                        ? variantImages[key]
                        : colorImgs;
                      const isUploading = variantUploading[key];
                      const currentPrice = variantPrices[key] ?? "";

                      return (
                        <tr key={key} className="hover:bg-slate-800/50 transition">
                          <td className="px-4 py-3 font-semibold text-white">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-2.5 w-2.5 rounded-full bg-blue-400 border border-blue-600" />
                              {color || "Mặc định"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-200">
                              {capacity || "Mặc định"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={currentPrice}
                                onChange={(event) =>
                                  handleVariantPriceChange(key, event.target.value)
                                }
                                placeholder={form.price ? String(form.price) : "0"}
                                className="w-36 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                              />
                              {currentPrice ? (
                                <p className="text-[11px] text-blue-400 font-medium">
                                  {formatCurrency(Number(currentPrice))}
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {images.map((img, imgIdx) => (
                                <div
                                  key={`${img}-${imgIdx}`}
                                  className="group relative h-11 w-11 rounded-lg border border-slate-700 bg-slate-950 overflow-hidden"
                                >
                                  <img
                                    src={getAssetUrl(img)}
                                    alt="Variant"
                                    className="h-full w-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariantImage(key, imgIdx)}
                                    className="absolute inset-0 flex items-center justify-center bg-rose-950/80 text-white opacity-0 group-hover:opacity-100 transition text-xs font-bold"
                                    title="Xóa ảnh này"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}

                              {/* Upload File Button */}
                              <label
                                className={`flex h-11 items-center gap-1.5 rounded-lg border border-dashed border-slate-700 bg-slate-950 px-2.5 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-white cursor-pointer ${
                                  isUploading ? "opacity-50 pointer-events-none" : ""
                                }`}
                                title="Tải thêm ảnh cho dòng này"
                              >
                                <span>{isUploading ? "..." : "+ Thêm ảnh"}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handleVariantImageUpload(key, e)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              {capacity && (
                                <button
                                  type="button"
                                  onClick={() => handleSyncPriceToCapacity(capacity, currentPrice)}
                                  className="text-xs font-medium text-blue-400 hover:underline hover:text-blue-300"
                                  title={`Áp dụng giá ${currentPrice ? formatCurrency(Number(currentPrice)) : ""} cho tất cả màu của ${capacity}`}
                                >
                                  Áp dụng giá cho mọi màu {capacity}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mô tả sản phẩm */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="description">
              Mô tả sản phẩm
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              placeholder="Nêu bật tính năng chính, chip xử lý, thời lượng pin, camera và ưu điểm sản phẩm..."
            />
          </div>

          {/* Ưu đãi khi mua máy & Quà tặng kèm */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-emerald-400 flex items-center gap-2" htmlFor="promotionsPolicy">
                <span className="text-base">🎁</span> Ưu đãi khi mua máy &amp; Quà tặng kèm VIP
              </label>
              <span className="text-xs text-slate-400">Xuống dòng để tạo từng gạch đầu dòng</span>
            </div>
            <textarea
              id="promotionsPolicy"
              name="promotionsPolicy"
              value={form.promotionsPolicy}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl border border-emerald-900/50 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 placeholder:text-slate-600"
              placeholder="Tặng củ sạc nhanh Apple 20W USB-C chính hãng trị giá 490.000₫&#10;Tặng ốp lưng MagSafe chống sốc &amp; Dán cường lực KingKong cao cấp&#10;Giảm thêm 500.000₫ khi tham gia Thu cũ đổi mới (Trade-in)&#10;Giảm 20% khi mua kèm phụ kiện AirPods / Apple Watch&#10;Hỗ trợ trả góp 0% lãi suất qua CCCD hoặc thẻ tín dụng"
            />
            <p className="text-xs text-slate-400">
              Các mục quà tặng sẽ được hiển thị thành danh sách huy hiệu nổi bật kèm icon trên trang chi tiết sản phẩm.
            </p>
          </div>

          {/* Chính sách bảo hành cam kết */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-blue-400 flex items-center gap-2" htmlFor="warrantyPolicy">
                <span className="text-base">🛡️</span> Chính sách bảo hành cam kết
              </label>
              <span className="text-xs text-slate-400">Xuống dòng để tạo từng cam kết</span>
            </div>
            <textarea
              id="warrantyPolicy"
              name="warrantyPolicy"
              value={form.warrantyPolicy}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl border border-blue-900/50 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 placeholder:text-slate-600"
              placeholder="Bảo hành 12 tháng chính hãng tại Ngọc Triết Store.&#10;Lỗi 1 đổi 1 trong 30 ngày đầu nếu phát sinh lỗi nhà sản xuất.&#10;Miễn phí vệ sinh máy &amp; dán lại cường lực trọn đời máy."
            />
            <p className="text-xs text-slate-400">
              Hiển thị trong khung cam kết chất lượng chính hãng của Ngọc Triết Store.
            </p>
          </div>

          {/* Album ảnh tổng của sản phẩm */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Album ảnh sản phẩm (Hiển thị chung) <span className="text-rose-500">*</span>
                </p>
                <p className="text-xs text-slate-500">
                  Ảnh đầu tiên sẽ tự động làm ảnh đại diện chính của sản phẩm.
                </p>
              </div>
              <label
                className={`inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-600/20 px-4 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-600/30 cursor-pointer ${
                  galleryUploading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <span>{galleryUploading ? "Đang tải ảnh..." : "+ Tải ảnh album"}</span>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </label>
            </div>

            {gallery.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
                {gallery.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className={`relative overflow-hidden rounded-xl border p-2 bg-slate-950 ${
                      index === 0 ? "border-blue-500 ring-2 ring-blue-500/30" : "border-slate-800"
                    }`}
                  >
                    <img
                      src={getAssetUrl(image)}
                      alt={`Gallery ${index + 1}`}
                      className="h-28 w-full rounded-lg object-contain"
                    />
                    <div className="mt-2 space-y-1">
                      {index === 0 ? (
                        <span className="block text-center rounded-md bg-blue-600/20 py-0.5 text-[10px] font-bold text-blue-300">
                          Ảnh chính
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCoverImage(index)}
                          className="w-full rounded-md border border-slate-700 py-0.5 text-[10px] text-slate-300 hover:border-blue-400 hover:text-white transition"
                        >
                          Làm ảnh chính
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(index)}
                        className="w-full rounded-md border border-rose-500/40 py-0.5 text-[10px] text-rose-300 hover:bg-rose-500/20 transition"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                Chưa có ảnh nào. Vui lòng bấm &quot;+ Tải ảnh album&quot; để thêm ảnh đại diện cho sản phẩm.
              </div>
            )}
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              Huỷ chỉnh sửa
            </button>
          )}
          <div className="flex flex-1 justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? editingId
                  ? "Đang lưu thay đổi..."
                  : "Đang tạo sản phẩm..."
                : editingId
                ? "Cập nhật sản phẩm"
                : "Thêm sản phẩm mới"}
            </button>
          </div>
        </div>
      </form>

      {/* DANH SÁCH SẢN PHẨM HIỆN TẠI */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Danh sách sản phẩm Apple</h2>
            <p className="text-sm text-slate-400">
              Tổng giá trị tồn kho: <strong className="text-white">{formatCurrency(inventoryValue)}</strong>
            </p>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            {products.length} sản phẩm
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Phân loại</th>
                <th className="px-4 py-3 text-right">Giá bán</th>
                <th className="px-4 py-3 text-center">Biến thể</th>
                <th className="px-4 py-3 text-right">Tồn kho</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-4 text-center text-slate-600">
                      Đang tải danh sách...
                    </td>
                  </tr>
                ))
              ) : products.length ? (
                products.map((product) => {
                  const variantCount = Array.isArray(product.variants) ? product.variants.length : 0;
                  const colorCount = Array.isArray(product.options?.colors) ? product.options.colors.length : 0;

                  return (
                    <tr key={product._id} className="hover:bg-slate-800/60 transition">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              getAssetUrl(product.imageUrl || product.images?.[0]) ||
                              "https://placehold.co/64x64?text=No+Image"
                            }
                            alt={product.name}
                            className="h-14 w-14 rounded-xl border border-slate-800 bg-slate-950 object-contain p-1"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white hover:text-blue-400 transition">
                                {product.name}
                              </p>
                              {product.featured && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30 shadow-sm">
                                  ⭐ Spotlight
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              #{product._id?.slice(-6)} • {product.brand || "Apple"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-block rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300 border border-blue-500/20">
                          {product.category || "Chưa phân loại"}
                        </span>
                        {product.subCategory ? (
                          <span className="block mt-1 text-[11px] text-slate-400">
                            {product.subCategory}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-right font-extrabold text-slate-100">
                        {formatCurrency(product.finalPrice ?? product.price ?? 0)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {variantCount > 0 ? (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                            {colorCount} màu ({variantCount} biến thể)
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Mặc định</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-slate-300 font-medium">
                        {product.stock ?? 0}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSpotlight(product)}
                            disabled={isSubmitting || deletingId === product._id}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                              product.featured
                                ? "border-amber-500/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white"
                                : "border-slate-700 bg-slate-900 text-slate-400 hover:border-amber-500/50 hover:text-amber-300"
                            }`}
                            title="Đặt làm sản phẩm nổi bật trang chủ"
                          >
                            {product.featured ? "★ Đang nổi bật" : "☆ Đặt nổi bật"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            disabled={isSubmitting || deletingId === product._id}
                            className="rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            disabled={isSubmitting || deletingId === product._id}
                            className="rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Chưa có sản phẩm nào trong hệ thống.
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
