import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("chaintrace_token"));
  const [loading, setLoading] = useState(true);

  const login = useCallback((t: string, u: User) => {
    localStorage.setItem("chaintrace_token", t);
    localStorage.setItem("chaintrace_user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("chaintrace_token");
    localStorage.removeItem("chaintrace_user");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("chaintrace_user");
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        logout();
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
