import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter, RouterProvider } from "react-router-dom";

import "./styles/index.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { router } from "./app/routes.jsx";
import { store } from "./store/index.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import PortActivity from "./pages/Port.jsx";

const isStandalonePort = import.meta.env.VITE_PORT_STANDALONE === "true";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      {isStandalonePort ? (
        <BrowserRouter>
          <PortActivity />
        </BrowserRouter>
      ) : (
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      )}
    </Provider>
  </React.StrictMode>
);
