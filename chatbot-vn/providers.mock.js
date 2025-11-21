const mockProducts = [
  {
    sku: "IP15PM-256",
    name: "iPhone 15 Pro Max 256GB",
    brand: "Apple",
    price: 34990000,
    ram_gb: 8,
    storage_gb: 256,
    url: "https://cellphone-s.example/apple/iphone-15-pro-max",
  },
  {
    sku: "IP14P-128",
    name: "iPhone 14 Pro 128GB",
    brand: "Apple",
    price: 26990000,
    ram_gb: 6,
    storage_gb: 128,
    url: "https://cellphone-s.example/apple/iphone-14-pro",
  },
  {
    sku: "S24U-512",
    name: "Samsung Galaxy S24 Ultra 512GB",
    brand: "Samsung",
    price: 32990000,
    ram_gb: 12,
    storage_gb: 512,
    url: "https://cellphone-s.example/samsung/galaxy-s24-ultra",
  },
  {
    sku: "S23-256",
    name: "Samsung Galaxy S23 256GB",
    brand: "Samsung",
    price: 18990000,
    ram_gb: 8,
    storage_gb: 256,
    url: "https://cellphone-s.example/samsung/galaxy-s23",
  },
  {
    sku: "XM13P-256",
    name: "Xiaomi 13 Pro 256GB",
    brand: "Xiaomi",
    price: 14990000,
    ram_gb: 12,
    storage_gb: 256,
    url: "https://cellphone-s.example/xiaomi/13-pro",
  },
  {
    sku: "XM13T-128",
    name: "Xiaomi 13T 128GB",
    brand: "Xiaomi",
    price: 10990000,
    ram_gb: 8,
    storage_gb: 128,
    url: "https://cellphone-s.example/xiaomi/13t",
  },
];

export const productsProvider = {
  search({
    brand,
    price_max: priceMax,
    ram_gb: ramGb,
    storage_gb: storageGb,
  } = {}) {
    return mockProducts
      .filter((item) => {
        if (brand && item.brand.toLowerCase() !== brand.toLowerCase()) {
          return false;
        }
        if (priceMax && item.price > Number(priceMax)) {
          return false;
        }
        if (ramGb && item.ram_gb < Number(ramGb)) {
          return false;
        }
        if (storageGb && item.storage_gb < Number(storageGb)) {
          return false;
        }
        return true;
      })
      .slice(0, 3);
  },
};

export const orderProvider = {
  lookup({ order_id: orderId, phone_number: phoneNumber } = {}) {
    if (orderId === "DH123") {
      return {
        order_id: orderId,
        phone_number: phoneNumber || "Ẩn",
        status: "Đang giao",
        carrier: "GHN",
        eta: "2-3 ngày",
        last_update: new Date().toISOString(),
      };
    }
    return {
      order_id: orderId || "",
      phone_number: phoneNumber || "",
      status: "Không tìm thấy",
      message: "Không tìm thấy thông tin đơn hàng. Vui lòng kiểm tra lại mã đơn.",
    };
  },
};

export default {
  productsProvider,
  orderProvider,
};
