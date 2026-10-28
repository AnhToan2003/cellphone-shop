import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Toaster } from "react-hot-toast";

import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";
import {
  AuthNavigationHandler,
  useAuth,
} from "./context/AuthContext.jsx";
import PhoneContactPopup from "./components/PhoneContactPopup.jsx";

const ScrollMotionFX = () => {
  const frameRef = useRef(null);

  useEffect(() => {
    const updateMetrics = () => {
      const doc = document.documentElement;
      const scrollY = doc.scrollTop || window.pageYOffset || 0;
      const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
      const nextProgress = Math.min(1, Math.max(0, scrollY / max));
      doc.style.setProperty("--scroll-progress", nextProgress.toFixed(3));
      frameRef.current = null;
    };

    const handleScroll = () => {
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(updateMetrics);
    };

    updateMetrics();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="scroll-progress-bar" aria-hidden="true" />
  );
};

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
    <div className="relative flex min-h-screen flex-col bg-slate-50 selection:bg-slate-900 selection:text-white">
      <ScrollMotionFX />
      <div className="relative z-20 flex min-h-screen flex-col">
        <AuthNavigationHandler />
        <Header />
        <main key={location.pathname} className="flex-1 page-transition">
          <Outlet />
        </main>
        <Footer />
        <PhoneContactPopup />
      </div>

      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
};

export default PublicLayout;
