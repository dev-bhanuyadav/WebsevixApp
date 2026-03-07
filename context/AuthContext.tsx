"use client";

import React, { createContext, useCallback, useEffect, useRef, useState } from "react";

export interface UserPublic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "client" | "developer" | "admin";
  avatar: string | null;
  isVerified: boolean;
  profileComplete: boolean;
}

export interface AuthTokens {
  accessToken: string;
  user: UserPublic;
}

const API = typeof window !== "undefined" ? "/api" : "";

interface AuthContextType {
  user: UserPublic | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const REFRESH_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API}/auth/refresh`, { method: "POST", credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      const token = data.accessToken;
      if (token) setAccessToken(token);
      return token;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    } finally {
      setUser(null);
      setAccessToken(null);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    }
  }, []);

  const login = useCallback((tokens: AuthTokens) => {
    setAccessToken(tokens.accessToken);
    setUser(tokens.user);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await refreshAccessToken();
        if (cancelled || !token) {
          setIsLoading(false);
          return;
        }
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setAccessToken(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshAccessToken]);

  useEffect(() => {
    if (!accessToken) return;
    const schedule = () => {
      refreshTimeoutRef.current = setTimeout(async () => {
        const newToken = await refreshAccessToken();
        if (newToken) schedule();
      }, REFRESH_INTERVAL_MS);
    };
    schedule();
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [accessToken, refreshAccessToken]);

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    login,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
