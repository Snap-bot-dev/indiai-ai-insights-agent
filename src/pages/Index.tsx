
import { useState, useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContext';
import LoginScreen from '../components/auth/LoginScreen';
import Dashboard from '../components/dashboard/Dashboard';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  return (
    <AuthProvider>
      <DataProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          {!isAuthenticated ? (
            <LoginScreen 
              onLogin={(role) => {
                setIsAuthenticated(true);
                setUserRole(role);
              }} 
            />
          ) : (
            <Dashboard userRole={userRole} />
          )}
          <Toaster />
        </div>
      </DataProvider>
    </AuthProvider>
  );
};

export default Index;
