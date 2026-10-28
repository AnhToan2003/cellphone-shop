import { expect, test } from "@playwright/test";

const testProduct = {
  _id: "product-test-1",
  name: "Điện thoại kiểm thử",
  slug: "dien-thoai-kiem-thu",
  brand: "Test",
  price: 12_000_000,
  finalPrice: 11_000_000,
  oldPrice: 13_000_000,
  stock: 5,
  imageUrl: "/logo.jpg",
  images: ["/logo.jpg"],
  rating: 4.8,
  ratingCount: 14,
  description: "Sản phẩm dữ liệu dùng cho kiểm thử giao diện.",
  options: { colors: [], capacities: [], colorImages: {} },
  variants: [],
  specs: {},
};

const mockApi = async (page) => {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith("/api/")) return route.continue();
    const pathname = url.pathname;
    const method = request.method();

    if (pathname.endsWith("/auth/login") && method === "POST") {
      return route.fulfill({
        json: {
          success: true,
          data: {
            token: "e2e-token",
            user: {
              _id: "user-test-1",
              name: "Người dùng kiểm thử",
              email: "e2e@example.test",
              role: "user",
            },
          },
        },
      });
    }

    if (pathname.endsWith("/auth/me")) {
      return route.fulfill({
        json: {
          success: true,
          data: {
            _id: "user-test-1",
            name: "Người dùng kiểm thử",
            email: "e2e@example.test",
            role: "user",
          },
        },
      });
    }

    if (pathname.endsWith("/products/dien-thoai-kiem-thu/reviews")) {
      return route.fulfill({ json: { success: true, data: [], meta: { total: 0, average: 0, canReview: false } } });
    }

    if (pathname.endsWith("/products/dien-thoai-kiem-thu")) {
      return route.fulfill({ json: { success: true, data: testProduct } });
    }

    if (pathname.endsWith("/products") && method === "GET") {
      return route.fulfill({
        json: {
          success: true,
          data: [testProduct],
          pagination: { page: 1, limit: 24, totalItems: 1, totalPages: 1 },
        },
      });
    }

    if (pathname.endsWith("/banners")) {
      return route.fulfill({ json: { success: true, data: [], featured: null } });
    }

    if (pathname.endsWith("/orders") && method === "POST") {
      return route.fulfill({
        status: 201,
        json: {
          success: true,
          data: { _id: "order-test-1", status: "pending", items: [] },
        },
      });
    }

    if (pathname.endsWith("/admin/overview")) {
      return route.fulfill({ json: { success: true, data: { totalRevenue: 0, totalProfit: 0, totalOrders: 0, totalProducts: 1, totalUsers: 1, paymentBreakdown: { cod: {}, other: {} }, revenueTimeline: [], topProducts: [] } } });
    }

    return route.fulfill({ json: { success: true, data: [] } });
  });
};

const resetBrowserStorage = async (page) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
};

const setAdminSession = (page) =>
  page.addInitScript(() => {
    sessionStorage.setItem(
      "cellphones_auth",
      JSON.stringify({
        token: "e2e-admin-token",
        user: { _id: "admin-test-1", name: "Admin Test", email: "admin@example.test", role: "admin" },
      })
    );
  });

test.beforeEach(async ({ page }) => {
  await resetBrowserStorage(page);
  await mockApi(page);
});

const responsiveRoutes = [
  { name: "home", path: "/" },
  { name: "catalog", path: "/products" },
  { name: "product detail", path: `/product/${testProduct.slug}` },
  { name: "cart", path: "/cart" },
  { name: "sign-in", path: "/login" },
];

for (const viewport of [
  { width: 320, height: 740 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]) {
  for (const route of responsiveRoutes) {
    test(`${route.name} fits ${viewport.width}px viewport without horizontal scrolling`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(route.path);
      await expect(page.locator("#root > *")).toHaveCount(1);

      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
        offenders: Array.from(document.querySelectorAll("body *"))
          .map((element) => ({
            tag: element.tagName,
            className: typeof element.className === "string" ? element.className : "",
            right: Math.round(element.getBoundingClientRect().right),
            width: Math.round(element.getBoundingClientRect().width),
          }))
          .filter((element) => element.right > document.documentElement.clientWidth + 1)
          .slice(0, 8),
      }));
      expect(dimensions.content, `${route.name} overflowed at ${viewport.width}px: ${JSON.stringify(dimensions.offenders)}`).toBeLessThanOrEqual(
        dimensions.viewport + 1
      );
    });
  }
}

for (const viewport of [
  { width: 320, height: 740 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`admin product management fits ${viewport.width}px viewport`, async ({ page }) => {
    await setAdminSession(page);
    await page.setViewportSize(viewport);
    await page.goto("/admin/products");
    await expect(page.getByRole("heading", { name: "Quản lý sản phẩm Apple" })).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
      offenders: Array.from(document.querySelectorAll("body *"))
        .map((element) => ({
          tag: element.tagName,
          className: typeof element.className === "string" ? element.className : "",
          right: Math.round(element.getBoundingClientRect().right),
          width: Math.round(element.getBoundingClientRect().width),
        }))
        .filter((element) => element.right > document.documentElement.clientWidth + 1)
        .slice(0, 8),
    }));
    expect(dimensions.content, `admin overflowed at ${viewport.width}px: ${JSON.stringify(dimensions.offenders)}`).toBeLessThanOrEqual(
      dimensions.viewport + 1
    );
  });
}

test("admin can set a product as the home spotlight", async ({ page }) => {
  await setAdminSession(page);
  await page.goto("/admin/products");
  await page.getByRole("button", { name: /Đặt nổi bật/ }).first().click();
  await expect(page.getByText('Đã đặt "Điện thoại kiểm thử" làm sản phẩm nổi bật trang chủ!')).toBeVisible();
});

test("catalog add-to-cart and quantity controls work", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText(testProduct.name).first()).toBeVisible();
  await page.getByRole("button", { name: "Thêm vào giỏ hàng" }).first().click();
  await page.getByRole("link", { name: "Giỏ hàng" }).click();

  await expect(page.getByText("Bạn có 1 sản phẩm sẵn sàng thanh toán.")).toBeVisible();
  await page.getByRole("button", { name: "Tăng số lượng" }).click();
  await expect(page.getByText("Bạn có 2 sản phẩm sẵn sàng thanh toán.")).toBeVisible();
});

test("product detail loads and adds selected product to cart", async ({ page }) => {
  await page.goto(`/product/${testProduct.slug}`);
  await expect(page.getByRole("heading", { name: testProduct.name })).toBeVisible();
  await page.getByRole("button", { name: "Thêm vào giỏ hàng" }).click();
  await page.getByRole("link", { name: "Giỏ hàng" }).click();
  await expect(page.getByText("Bạn có 1 sản phẩm sẵn sàng thanh toán.")).toBeVisible();
});

test("protected checkout redirects guests to sign in", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Đăng nhập tài khoản" })).toBeVisible();
});

test("sign-in accepts the mocked API response", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("admin@example.com hoặc tên tài khoản").fill("e2e@example.test");
  await page.getByPlaceholder("••••••••").fill("secure-test-password");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("main")).toBeVisible();
});
