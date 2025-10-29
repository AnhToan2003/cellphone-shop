import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  AuthNavigationHandler,
} from "../../context/AuthContext.jsx";
import AdminHeader from "../../components/AdminHeader.jsx";
import AdminSidebar from "../../components/AdminSidebar.jsx";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AuthNavigationHandler />
      <AdminHeader onToggleSidebar={() => setIsSidebarOpen(true)} />
      <div className="flex pt-16">
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 px-4 pt-12 pb-10 lg:ml-60 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-8 pb-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
