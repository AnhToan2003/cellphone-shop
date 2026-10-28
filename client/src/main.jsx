import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";

import "./styles/index.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { router } from "./app/routes.jsx";
import { store } from "./store/index.js";
import { AuthProvider } from "./context/AuthContext.jsx";

if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem("cellphones_api_activity");
  } catch {
    // Ignore storage restrictions while clearing obsolete monitor data.
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <React.Suspense
          fallback={
            <main className="app-loading" aria-live="polite" aria-busy="true">
              <span className="app-loading__spinner" aria-hidden="true" />
              <span>Đang tải cửa hàng…</span>
            </main>
          }
        >
          <RouterProvider router={router} />
        </React.Suspense>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);
