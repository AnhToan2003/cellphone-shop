import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "cellphones_auth";

const AuthCtx = createContext(null);

const isBrowser = () => typeof window !== "undefined";

const getStorage = () => {
  if (!isBrowser()) return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }
  return {
    ...user,
    role: user.role || "user",
    phone: user.phone || "",
    address: user.address || "",
    lifetimeSpend: user.lifetimeSpend || 0,
    customerTier: user.customerTier || "bronze",
  };
};

const persistAuth = (token, user) => {
  const storage = getStorage();
  if (!storage) return;
  if (!token || !user) {
    storage.removeItem(STORAGE_KEY);
    return;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
};

const readPersistedAuth = () => {
  const storage = getStorage();
  if (!storage) return { token: null, user: null };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return { token: null, user: null };
    }
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token ?? null,
      user: parsed?.user ?? null,
    };
  } catch {
    return { token: null, user: null };
  }
};

const clearPersistedAuth = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
};

const getApiUrl = (path) => {
  const base = import.meta?.env?.VITE_API_URL;
  if (base) {
    return `${base}${path}`;
  }
  return `/api${path}`;
};

export function AuthProvider({ children }) {
  const navRef = useRef(null);
  const runNavigate = useCallback((to, options) => {
    if (navRef.current) {
      navRef.current(to, options);
      return;
    }
    if (typeof window !== "undefined") {
      if (options?.replace) {
        window.location.replace(to);
      } else {
        window.location.assign(to);
      }
    }
  }, []);

  const [{ token, user, status, error }, setState] = useState(() => {
    const persisted = readPersistedAuth();
    const normalizedUser =
      persisted.token && persisted.user
        ? normalizeUser(persisted.user)
        : null;

    if (!persisted.token || !normalizedUser) {
      clearPersistedAuth();
    }

    return {
      token: persisted.token && normalizedUser ? persisted.token : null,
      user: normalizedUser,
      status: "idle",
      error: null,
    };
  });

  const setAuth = useCallback((nextToken, nextUser) => {
    const normalized = normalizeUser(nextUser);
    persistAuth(nextToken, normalized);
    setState({
      token: nextToken,
      user: normalized,
      status: "idle",
      error: null,
    });
  }, []);

  const handleAuthError = useCallback((fallbackMessage, err) => {
    const message =
      err?.message ||
      err?.response?.data?.message ||
      fallbackMessage ||
      "Xác thực thất bại";
    setState((prev) => ({
      ...prev,
      status: "idle",
      error: message,
    }));
    return message;
  }, []);

  const login = useCallback(
    async (credentials = {}) => {
      setState((prev) => ({ ...prev, status: "loading", error: null }));
      try {
        const identifier =
          credentials.identifier?.trim() ||
          credentials.email?.trim() ||
          credentials.username?.trim() ||
          "";
        if (!identifier) {
          throw new Error("Vui lòng nhập email hoặc tên đăng nhập");
        }

        const response = await fetch(getApiUrl("/auth/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier,
            password: credentials.password,
          }),
        });
        const json = await response.json().catch(() => null);

        if (!response.ok || !json) {
          const message =
            json?.message ||
            json?.error ||
            "Không thể đăng nhập. Vui lòng thử lại.";
          throw new Error(message);
        }

        const payload = json?.data || json;
        if (!payload?.token || !payload?.user) {
          throw new Error("Phản hồi đăng nhập không hợp lệ");
        }

        setAuth(payload.token, payload.user);
        const destination =
          (payload.user.role || "").toLowerCase() === "admin"
            ? "/admin"
            : "/";
        runNavigate(destination, { replace: true });
        return normalizeUser(payload.user);
      } catch (err) {
        const message = handleAuthError(
          "Không thể đăng nhập. Vui lòng thử lại.",
          err
        );
        throw new Error(message);
      }
    },
    [handleAuthError, runNavigate, setAuth]
  );

  const register = useCallback(
    async (payload = {}) => {
      setState((prev) => ({ ...prev, status: "loading", error: null }));
      try {
        const body = {
          name: payload.name?.trim() || "",
          username: payload.username?.trim() || "",
          email: payload.email?.trim()?.toLowerCase() || "",
          password: payload.password,
        };

        const response = await fetch(getApiUrl("/auth/register"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await response.json().catch(() => null);

        if (!response.ok || !json) {
          const message =
            json?.message ||
            json?.error ||
            "Không thể tạo tài khoản. Vui lòng thử lại.";
          throw new Error(message);
        }

        const data = json?.data || json;
        if (!data?.token || !data?.user) {
          throw new Error("Phản hồi đăng ký không hợp lệ");
        }

        setAuth(data.token, data.user);
        const destination =
          (data.user.role || "").toLowerCase() === "admin"
            ? "/admin"
            : "/";
        runNavigate(destination, { replace: true });
        return normalizeUser(data.user);
      } catch (err) {
        const message = handleAuthError(
          "Không thể tạo tài khoản. Vui lòng thử lại.",
          err
        );
        throw new Error(message);
      }
    },
    [handleAuthError, runNavigate, setAuth]
  );

  const updateProfile = useCallback(
    async (payload = {}) => {
      if (!token) {
        throw new Error("Bạn cần đăng nhập để cập nhật thông tin");
      }

      setState((prev) => ({ ...prev, status: "loading", error: null }));
      try {
        const response = await fetch(getApiUrl("/auth/me"), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const json = await response.json().catch(() => null);
        if (!response.ok || !json?.data?.user) {
          const message =
            json?.message || "Không thể cập nhật hồ sơ. Vui lòng thử lại.";
          throw new Error(message);
        }

        const normalized = normalizeUser(json.data.user);
        persistAuth(token, normalized);
        setState((prev) => ({
          ...prev,
          user: normalized,
          status: "idle",
          error: null,
        }));
        return normalized;
      } catch (error) {
        const message =
          error?.message || "Không thể cập nhật hồ sơ. Vui lòng thử lại.";
        setState((prev) => ({ ...prev, status: "idle", error: message }));
        throw new Error(message);
      }
    },
    [token]
  );

  const logout = useCallback(() => {
    clearPersistedAuth();
    setState({ token: null, user: null, status: "idle", error: null });
    runNavigate("/", { replace: true });
  }, [runNavigate]);

  const refreshCurrentUser = useCallback(async () => {
    const persisted = readPersistedAuth();
    if (!persisted.token) {
      return null;
    }

    try {
      const response = await fetch(getApiUrl("/auth/me"), {
        headers: {
          Authorization: `Bearer ${persisted.token}`,
        },
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json) {
        clearPersistedAuth();
        setState((prev) => ({
          ...prev,
          token: null,
          user: null,
        }));
        return null;
      }

      const data =
        json?.data?.user || json?.data || json?.user || json;
      const normalized = normalizeUser(data);
      persistAuth(persisted.token, normalized);
      setState((prev) => ({
        ...prev,
        token: persisted.token,
        user: normalized,
      }));
      return normalized;
    } catch {
      clearPersistedAuth();
      setState((prev) => ({
        ...prev,
        token: null,
        user: null,
      }));
      return null;
    }
  }, []);

  useEffect(() => {
    if (token && !user) {
      refreshCurrentUser();
    }
  }, [token, user, refreshCurrentUser]);

  const setNavigator = useCallback((navFn) => {
    navRef.current = navFn || null;
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      status,
      error,
      isAuthenticated: Boolean(token && user),
      isAdmin: (user?.role || "").toLowerCase() === "admin",
      login,
      register,
      updateProfile,
      logout,
      refreshCurrentUser,
      setNavigator,
    }),
    [
      token,
      user,
      status,
      error,
      login,
      register,
      updateProfile,
      logout,
      refreshCurrentUser,
      setNavigator,
    ]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}

export function AuthNavigationHandler() {
  const { setNavigator } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setNavigator(navigate);
    return () => setNavigator(null);
  }, [navigate, setNavigator]);

  return null;
}
