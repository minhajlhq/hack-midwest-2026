import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  walletAddress: string;
  currentBalance?: number;
  isActive: boolean;
  lastLogin?: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication data on app load
    const checkAuthStatus = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedAuth = localStorage.getItem('isAuthenticated');
        
        if (storedUser && storedAuth === 'true') {
          const userData = JSON.parse(storedUser);
          
          // Fetch latest user data from API
          try {
            const response = await fetch(`http://localhost:3000/api/users/${userData.id}`);
            if (response.ok) {
              const latestUserData = await response.json();
              setUser(latestUserData);
              setIsAuthenticated(true);
              // Update localStorage with latest data
              localStorage.setItem('user', JSON.stringify(latestUserData));
            } else {
              // If API call fails, use stored data but log the error
              console.warn('Failed to fetch latest user data, using stored data');
              setUser(userData);
              setIsAuthenticated(true);
            }
          } catch (apiError) {
            // If API call fails, use stored data but log the error
            console.warn('Error fetching latest user data:', apiError);
            setUser(userData);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  };

  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/users/${user.id}`);
      if (response.ok) {
        const latestUserData = await response.json();
        setUser(latestUserData);
        localStorage.setItem('user', JSON.stringify(latestUserData));
      } else {
        console.warn('Failed to refresh user data');
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    loading,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
