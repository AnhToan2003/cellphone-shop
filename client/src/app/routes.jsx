import { createBrowserRouter } from "react-router-dom";

import PublicLayout from "../App.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import AdminRoute from "../routes/AdminRoute.jsx";
import AdminLayout from "../pages/admin/AdminLayout.jsx";
import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import ManageUsers from "../pages/admin/ManageUsers.jsx";
import ManageUserRanks from "../pages/admin/ManageUserRanks.jsx";
import ManageProducts from "../pages/admin/ManageProducts.jsx";
import ManageBanners from "../pages/admin/ManageBanners.jsx";
import ManageOrders from "../pages/admin/ManageOrders.jsx";
import ManageWarranty from "../pages/admin/ManageWarranty.jsx";
import ManagePromotions from "../pages/admin/ManagePromotions.jsx";
import ManageCategories from "../pages/admin/ManageCategories.jsx";
import ManageBrands from "../pages/admin/ManageBrands.jsx";
import Cart from "../pages/Cart.jsx";
import Checkout from "../pages/Checkout.jsx";
import Orders from "../pages/Orders.jsx";
import PublicHome from "../pages/PublicHome.jsx";
import Login from "../pages/Login.jsx";
import ProductDetail from "../pages/ProductDetail.jsx";
import Register from "../pages/Register.jsx";
import Favorites from "../pages/Favorites.jsx";
import Profile from "../pages/Profile.jsx";
import WarrantyPolicy from "../pages/WarrantyPolicy.jsx";
import PaymentReturn from "../pages/PaymentReturn.jsx";
import PortActivity from "../pages/Port.jsx";
import ProductList from "../pages/ProductList.jsx";

const NotFound = () => (
  <div className="container-safe py-20 text-center">
    <h1 className="text-3xl font-bold text-slate-900">404</h1>
    <p className="mt-4 text-slate-500">Không tìm thấy trang bạn yêu cầu.</p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <PublicHome /> },
      { path: "product/:slug", element: <ProductDetail /> },
      { path: "category/:categoryKey", element: <ProductList /> },
      { path: "cart", element: <Cart /> },
      { path: "favorites", element: <Favorites /> },
      {
        path: "checkout",
        element: (
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "warranty",
        element: (
          <ProtectedRoute>
            <WarrantyPolicy />
          </ProtectedRoute>
        ),
      },
      { path: "payment-return", element: <PaymentReturn /> },
      { path: "register", element: <Register /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/port", element: <PortActivity /> },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "users", element: <ManageUsers /> },
      { path: "user-rankings", element: <ManageUserRanks /> },
      { path: "products", element: <ManageProducts /> },
      { path: "orders", element: <ManageOrders /> },
      { path: "warranty", element: <ManageWarranty /> },
      { path: "promotions", element: <ManagePromotions /> },
      { path: "brands", element: <ManageBrands /> },
      { path: "home-categories", element: <ManageCategories /> },
      { path: "banners", element: <ManageBanners /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

export default router;
