import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

import {
  AuthNavigationHandler,
} from "../../context/AuthContext.jsx";
import AdminHeader from "../../components/AdminHeader.jsx";
import AdminSidebar from "../../components/AdminSidebar.jsx";
import BackButton from "../../components/BackButton.jsx";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <AuthNavigationHandler />
      <AdminHeader onToggleSidebar={() => setIsSidebarOpen(true)} />
      <div className="flex pt-16">
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="min-w-0 flex-1 px-4 pt-12 pb-10 lg:ml-60 lg:px-10">
          <BackButton
            fallback="/admin"
            variant="dark"
            wrapperClassName="mb-6"
            className="border-slate-800 bg-slate-900/70 text-slate-100"
          />
          <div className="mx-auto min-w-0 max-w-6xl space-y-8 pb-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
