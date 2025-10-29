import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";
import {
  AuthNavigationHandler,
  useAuth,
} from "./context/AuthContext.jsx";

const PublicLayout = () => {
  const location = useLocation();
  const { token, refreshCurrentUser } = useAuth();

  useEffect(() => {
    if (token) {
      refreshCurrentUser();
    }
  }, [token, refreshCurrentUser]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen flex-col bg-muted">
      <AuthNavigationHandler />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
};

export default PublicLayout;
