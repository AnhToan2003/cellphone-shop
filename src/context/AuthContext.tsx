import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

type AuthUser = {
  email: string;
  role: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "token";
const USER_KEY = "user";

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = window.localStorage.getItem(USER_KEY);

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        const parsed: AuthUser = JSON.parse(storedUser);
        if (parsed && parsed.email) {
          setUser(parsed);
        }
      } catch {
        window.localStorage.removeItem(USER_KEY);
      }
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message =
          errorBody?.message || "Unable to login. Please check your credentials.";
        throw new Error(message);
      }

      const data = await response.json();
      const receivedToken: string | undefined = data?.token;
      const receivedUser: Partial<AuthUser> | undefined = data?.user;

      if (!receivedToken || !receivedUser?.email) {
        throw new Error("Invalid response from server.");
      }

      let role = receivedUser.role;
      if (!role && receivedUser.email === "anhtoan@gmail.com") {
        role = "admin"; // TODO: remove once backend returns role consistently
      }
      const normalizedUser: AuthUser = {
        email: receivedUser.email,
        role: role || "user",
      };

      if (typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_KEY, receivedToken);
        window.localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      }

      setToken(receivedToken);
      setUser(normalizedUser);

      if (normalizedUser.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    },
    [navigate]
  );

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
    setToken(null);
    setUser(null);
    navigate("/");
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      login,
      logout,
    }),
    [user, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
