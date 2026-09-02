import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { initialUsers } from '../utils/sampleData';
import { apiLogin } from '../services/api';

interface AuthContextType {
  currentUser: User;
  users: User[];
  isAuthenticated: boolean;
  loginWithCredentials: (username: string, pin: string) => Promise<User | null>;
  switchUser: (userId: string, pin?: string) => boolean;
  logout: () => void;
  updateUser: (user: User) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  deleteUser: (userId: string) => void;
  isOwner: boolean;
  isAdmin: boolean;
  isDesigner: boolean;
  isOperator: boolean;
  canCreateOrder: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'cetakpro_users';
const SESSION_AUTH_STATE_KEY = 'cetakpro_session_auth_state';
const SESSION_CURRENT_USER_KEY = 'cetakpro_session_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clean up any legacy persistent auth state from localStorage so it never auto-logs in across app restarts
  useEffect(() => {
    try {
      localStorage.removeItem('cetakpro_auth_state');
      localStorage.removeItem('cetakpro_current_user');
    } catch {}
  }, []);

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialUsers;
    } catch {
      return initialUsers;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const isAuth = sessionStorage.getItem(SESSION_AUTH_STATE_KEY) === 'true';
      if (isAuth) {
        const saved = sessionStorage.getItem(SESSION_CURRENT_USER_KEY);
        if (saved) return JSON.parse(saved);
      }
      return initialUsers[0]; // fallback default
    } catch {
      return initialUsers[0];
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_AUTH_STATE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    try {
      if (isAuthenticated) {
        sessionStorage.setItem(SESSION_CURRENT_USER_KEY, JSON.stringify(currentUser));
        sessionStorage.setItem(SESSION_AUTH_STATE_KEY, 'true');
      } else {
        sessionStorage.removeItem(SESSION_CURRENT_USER_KEY);
        sessionStorage.setItem(SESSION_AUTH_STATE_KEY, 'false');
      }
    } catch {}
  }, [currentUser, isAuthenticated]);

  const loginWithCredentials = async (username: string, pin: string): Promise<User | null> => {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPin = (pin || '').trim();

    // STRICT VALIDATION: Both username and PIN must be non-empty!
    if (!cleanUsername || !cleanPin) {
      return null;
    }

    // 1. Check local user records: BOTH username and PIN/password MUST match strictly!
    const found = users.find(
      (u) =>
        u.active &&
        u.username.trim().toLowerCase() === cleanUsername &&
        (u.pin.trim() === cleanPin || ((u as any).password && (u as any).password.trim() === cleanPin))
    );

    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem(SESSION_CURRENT_USER_KEY, JSON.stringify(found));
        sessionStorage.setItem(SESSION_AUTH_STATE_KEY, 'true');
      } catch {}
      return found;
    }

    // 2. If not found locally, try MySQL Backend API
    try {
      const apiResult = await apiLogin(cleanUsername, cleanPin);
      if (apiResult && apiResult.success && apiResult.user) {
        setCurrentUser(apiResult.user);
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem(SESSION_CURRENT_USER_KEY, JSON.stringify(apiResult.user));
          sessionStorage.setItem(SESSION_AUTH_STATE_KEY, 'true');
        } catch {}
        return apiResult.user;
      }
    } catch {
      // Ignore API errors
    }

    return null;
  };

  const switchUser = (userId: string, pin?: string): boolean => {
    const target = users.find((u) => u.id === userId && u.active);
    if (!target) return false;
    if (pin && target.pin && target.pin !== pin) {
      return false;
    }
    setCurrentUser(target);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem(SESSION_CURRENT_USER_KEY, JSON.stringify(target));
      sessionStorage.setItem(SESSION_AUTH_STATE_KEY, 'true');
    } catch {}
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(SESSION_CURRENT_USER_KEY);
      sessionStorage.setItem(SESSION_AUTH_STATE_KEY, 'false');
      localStorage.removeItem('cetakpro_auth_state');
      localStorage.removeItem('cetakpro_current_user');
    } catch {}
  };

  const updateUser = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  const addUser = (newUser: Omit<User, 'id'>) => {
    const user: User = {
      ...newUser,
      id: `USR-${Date.now().toString().slice(-4)}`,
    };
    setUsers((prev) => [...prev, user]);
  };

  const deleteUser = (userId: string) => {
    if (users.length <= 1) return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser.id === userId) {
      const fallback = users.find((u) => u.id !== userId);
      if (fallback) setCurrentUser(fallback);
      logout();
    }
  };

  const role: UserRole = currentUser.role || 'admin';
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin' || isOwner;
  const isDesigner = role === 'designer' || isOwner;
  const isOperator = role === 'operator' || isOwner;
  const canCreateOrder = isOwner || isAdmin || isDesigner;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated,
        loginWithCredentials,
        switchUser,
        logout,
        updateUser,
        addUser,
        deleteUser,
        isOwner,
        isAdmin,
        isDesigner,
        isOperator,
        canCreateOrder,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
