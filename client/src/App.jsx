import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";

import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";
import {
  AuthNavigationHandler,
  useAuth,
} from "./context/AuthContext.jsx";
import SupportChatbox from "./components/SupportChatbox.jsx";

const ScrollMotionFX = () => {
  const [progress, setProgress] = useState(0);
  const frameRef = useRef(null);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(typeof performance !== "undefined" ? performance.now() : 0);

  useEffect(() => {
    const updateMetrics = () => {
      const doc = document.documentElement;
      const scrollY = doc.scrollTop || window.pageYOffset || 0;
      const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
      const nextProgress = Math.min(1, Math.max(0, scrollY / max));
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const velocity =
        (scrollY - lastYRef.current) / Math.max(1, now - lastTimeRef.current);

      lastYRef.current = scrollY;
      lastTimeRef.current = now;

      setProgress(nextProgress);
      doc.style.setProperty("--scroll-progress", nextProgress.toFixed(3));
      doc.style.setProperty("--scroll-velocity", velocity.toFixed(4));
      doc.style.setProperty("--scroll-tilt", `${(velocity * 12).toFixed(2)}deg`);
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
    <div className="pointer-events-none fixed inset-0 z-10">
      <div
        className="scroll-progress-bar"
        style={{
          transform: `scaleX(${progress || 0.001})`,
          opacity: progress > 0 ? 1 : 0.4,
        }}
        aria-hidden
      />

      <div className="scroll-auras" aria-hidden>
        <div className="scroll-orb scroll-orb-primary" />
        <div className="scroll-orb scroll-orb-secondary" />
        <div className="scroll-sheen" />
      </div>
    </div>
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
    <div className="relative flex min-h-screen flex-col bg-muted">
      <ScrollMotionFX />
      <div aria-hidden className="bloom-backdrop">
        <div className="bloom-layer bloom-pink" />
        <div className="bloom-layer bloom-cyan" />
        <div className="bloom-layer bloom-amber" />
      </div>
      <div aria-hidden className="color-waves" />
      <div className="relative z-20 flex min-h-screen flex-col">
        <AuthNavigationHandler />
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />

        <SupportChatbox />
      </div>

      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
};

export default PublicLayout;
