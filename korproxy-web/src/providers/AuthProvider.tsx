"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useConvex } from "convex/react";
import { api } from "../../../korproxy-backend/convex/_generated/api";

interface User {
  id: string;
  email: string;
  name?: string;
  role: "user" | "admin";
  subscriptionStatus: "none" | "trialing" | "active" | "past_due" | "canceled" | "expired" | "lifetime";
  subscriptionPlan?: "monthly" | "yearly";
  trialEnd?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  createCheckoutSession: (plan: "monthly" | "yearly", successUrl: string, cancelUrl: string) => Promise<{ url?: string; error?: string }>;
  createPortalSession: (returnUrl: string) => Promise<{ url?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "korproxy_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const convex = useConvex();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveToken = useCallback((newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const fetchUser = useCallback(async (authToken: string) => {
    try {
      const userData = await convex.query(api.auth.me, { token: authToken });
      if (userData) {
        setUser(userData as User);
        return true;
      } else {
        saveToken(null);
        setUser(null);
        return false;
      }
    } catch {
      saveToken(null);
      setUser(null);
      return false;
    }
  }, [convex, saveToken]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
        const result = await convex.query(api.auth.validateToken, { token: storedToken });
        if (result.valid) {
          await fetchUser(storedToken);
        } else {
          saveToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [convex, fetchUser, saveToken]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await convex.mutation(api.auth.login, { email, password });
      if (result.success && result.token) {
        saveToken(result.token);
        await fetchUser(result.token);
        return { success: true };
      }
      return { success: false, error: result.error || "Login failed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Login failed" };
    }
  }, [convex, saveToken, fetchUser]);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const result = await convex.mutation(api.auth.register, { email, password, name });
      if (result.success && result.token) {
        saveToken(result.token);
        await fetchUser(result.token);
        return { success: true };
      }
      return { success: false, error: result.error || "Registration failed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Registration failed" };
    }
  }, [convex, saveToken, fetchUser]);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await convex.mutation(api.auth.logout, { token });
      } catch {
        // Ignore errors on logout
      }
    }
    saveToken(null);
    setUser(null);
  }, [convex, token, saveToken]);

  const createCheckoutSession = useCallback(async (plan: "monthly" | "yearly", successUrl: string, cancelUrl: string) => {
    if (!token) {
      return { error: "Not authenticated" };
    }
    try {
      const result = await convex.action(api.stripe.createCheckoutSession, {
        token,
        plan,
        successUrl,
        cancelUrl,
      });
      return result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to create checkout session" };
    }
  }, [convex, token]);

  const createPortalSession = useCallback(async (returnUrl: string) => {
    if (!token) {
      return { error: "Not authenticated" };
    }
    try {
      const result = await convex.action(api.stripe.createPortalSession, {
        token,
        returnUrl,
      });
      return result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to create portal session" };
    }
  }, [convex, token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        createCheckoutSession,
        createPortalSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
