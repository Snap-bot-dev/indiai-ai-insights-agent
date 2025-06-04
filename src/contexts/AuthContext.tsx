
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  role: 'dealer' | 'sales_rep' | 'admin';
  region?: string;
  dealerId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { username: string; password: string; role: string }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers = [
  { id: '1', username: 'dealer1', password: 'password', name: 'Raj Kumar', role: 'dealer', region: 'Chennai', dealerId: 'D001' },
  { id: '2', username: 'sales1', password: 'password', name: 'Priya Sharma', role: 'sales_rep', region: 'Mumbai' },
  { id: '3', username: 'admin1', password: 'password', name: 'Admin User', role: 'admin' },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: { username: string; password: string; role: string }): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(
      u => u.username === credentials.username && 
           u.password === credentials.password && 
           u.role === credentials.role
    );

    if (foundUser) {
      setUser({
        id: foundUser.id,
        name: foundUser.name,
        role: foundUser.role as 'dealer' | 'sales_rep' | 'admin',
        region: foundUser.region,
        dealerId: foundUser.dealerId
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
