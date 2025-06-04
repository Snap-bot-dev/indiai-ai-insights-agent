
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import ChatInterface from '../chat/ChatInterface';
import Analytics from '../analytics/Analytics';
import DataTable from '../data/DataTable';
import { MessageSquare, BarChart3, Database, LogOut, Bell } from 'lucide-react';

interface DashboardProps {
  userRole: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const { user, logout } = useAuth();
  const { skus, claims, sales } = useData();

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case 'dealer':
        return `Welcome back, ${user.name}! Ask me about SKU availability, your claims, or sales data.`;
      case 'sales_rep':
        return `Hello ${user.name}! I can help you with dealer performance, regional sales, and market insights.`;
      case 'admin':
        return `Welcome ${user.name}! You have full access to all system data and analytics.`;
      default:
        return 'Welcome to the Manufacturing AI Assistant!';
    }
  };

  const getStats = () => {
    const totalSKUs = skus.length;
    const activeClaims = claims.filter(c => c.status === 'Pending').length;
    const todaySales = sales.filter(s => s.date === new Date().toISOString().split('T')[0]).length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);

    return { totalSKUs, activeClaims, todaySales, totalRevenue };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Manufacturing AI Assistant
              </h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                {user?.name}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {getWelcomeMessage()}
              </h2>
              <p className="text-gray-600">
                Use natural language to query inventory, claims, sales data, and more.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total SKUs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalSKUs}</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.activeClaims}</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.todaySales}</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ₹{(stats.totalRevenue / 1000000).toFixed(1)}M
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>AI Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Data</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <ChatInterface userRole={user?.role} />
          </TabsContent>
          
          <TabsContent value="analytics">
            <Analytics userRole={user?.role} />
          </TabsContent>
          
          <TabsContent value="data">
            <DataTable userRole={user?.role} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
