import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type UserRole = "admin" | "employee";

export type AuthUser = {
  email: string;
  name: string;
  role: UserRole;
  employeeId?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
};

const STORAGE_KEY = "hrms-auth-user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as AuthUser;
  } catch (error) {
    console.error("Failed to parse stored auth user", error);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => parseStoredUser());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      login: (nextUser: AuthUser) => {
        setUser(nextUser);
      },
      logout: () => {
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

