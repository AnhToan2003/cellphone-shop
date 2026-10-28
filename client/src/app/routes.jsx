import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

import PublicLayout from "../App.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import AdminRoute from "../routes/AdminRoute.jsx";
import AdminLayout from "../pages/admin/AdminLayout.jsx";

const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard.jsx"));
const ManageUsers = lazy(() => import("../pages/admin/ManageUsers.jsx"));
const ManageUserRanks = lazy(() => import("../pages/admin/ManageUserRanks.jsx"));
const ManageProducts = lazy(() => import("../pages/admin/ManageProducts.jsx"));
const ManageBanners = lazy(() => import("../pages/admin/ManageBanners.jsx"));
const ManageOrders = lazy(() => import("../pages/admin/ManageOrders.jsx"));
const ManageWarranty = lazy(() => import("../pages/admin/ManageWarranty.jsx"));
const ManagePromotions = lazy(() => import("../pages/admin/ManagePromotions.jsx"));
const ManageCategories = lazy(() => import("../pages/admin/ManageCategories.jsx"));
const ManageProductCategories = lazy(() => import("../pages/admin/ManageProductCategories.jsx"));
const ManageBrands = lazy(() => import("../pages/admin/ManageBrands.jsx"));
const Cart = lazy(() => import("../pages/Cart.jsx"));
const Checkout = lazy(() => import("../pages/Checkout.jsx"));
const Orders = lazy(() => import("../pages/Orders.jsx"));
const PublicHome = lazy(() => import("../pages/PublicHome.jsx"));
const Login = lazy(() => import("../pages/Login.jsx"));
const ProductDetail = lazy(() => import("../pages/ProductDetail.jsx"));
const Register = lazy(() => import("../pages/Register.jsx"));
const AboutPage = lazy(() => import("../pages/About.jsx"));
const Favorites = lazy(() => import("../pages/Favorites.jsx"));
const AllProducts = lazy(() => import("../pages/AllProducts.jsx"));
const Profile = lazy(() => import("../pages/Profile.jsx"));
const WarrantyPolicy = lazy(() => import("../pages/WarrantyPolicy.jsx"));
const ProductList = lazy(() => import("../pages/ProductList.jsx"));
const NotFound = lazy(() => import("../pages/NotFound.jsx"));

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
      { path: "warranty", element: <WarrantyPolicy /> },
      { path: "register", element: <Register /> },
      { path: "about", element: <AboutPage /> },
      { path: "faq", element: <AboutPage initialSection="faq" /> },
      { path: "products", element: <AllProducts /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  { path: "/login", element: <Login /> },
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
      { path: "categories", element: <ManageProductCategories /> },
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
