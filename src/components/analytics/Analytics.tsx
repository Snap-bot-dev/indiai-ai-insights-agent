
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '../../contexts/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface AnalyticsProps {
  userRole?: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ userRole }) => {
  const { skus, claims, sales, dealers } = useData();

  // Process data for charts
  const getSalesDataByMonth = () => {
    const salesByMonth = sales.reduce((acc, sale) => {
      const month = new Date(sale.date).toLocaleDateString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + sale.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(salesByMonth).map(([month, amount]) => ({
      month,
      amount: amount / 1000000 // Convert to millions
    }));
  };

  const getClaimsDataByStatus = () => {
    const claimsByStatus = claims.reduce((acc, claim) => {
      acc[claim.status] = (acc[claim.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = { Pending: '#f59e0b', Approved: '#10b981', Rejected: '#ef4444' };
    
    return Object.entries(claimsByStatus).map(([status, count]) => ({
      name: status,
      value: count,
      color: colors[status as keyof typeof colors]
    }));
  };

  const getTopSellingProducts = () => {
    const productSales = sales.reduce((acc, sale) => {
      acc[sale.skuName] = (acc[sale.skuName] || 0) + sale.quantity;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([product, quantity]) => ({ product, quantity }));
  };

  const getRegionalSales = () => {
    const regionSales = sales.reduce((acc, sale) => {
      acc[sale.region] = (acc[sale.region] || 0) + sale.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(regionSales).map(([region, amount]) => ({
      region,
      amount: amount / 1000000 // Convert to millions
    }));
  };

  const salesData = getSalesDataByMonth();
  const claimsData = getClaimsDataByStatus();
  const topProducts = getTopSellingProducts();
  const regionalData = getRegionalSales();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Month */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Monthly revenue in millions (₹)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}M`, 'Revenue']} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Claims by Status */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Claims Distribution</CardTitle>
            <CardDescription>Claims breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={claimsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {claimsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing SKUs by quantity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="product" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Regional Sales */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Regional Performance</CardTitle>
            <CardDescription>Sales by region in millions (₹)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}M`, 'Revenue']} />
                <Bar dataKey="amount" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 animate-scale-in">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-700">{skus.length}</div>
            <div className="text-sm text-blue-600">Total SKUs</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 animate-scale-in">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-700">
              ₹{(sales.reduce((sum, sale) => sum + sale.amount, 0) / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-green-600">Total Revenue</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 animate-scale-in">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-700">
              {claims.filter(c => c.status === 'Pending').length}
            </div>
            <div className="text-sm text-orange-600">Pending Claims</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 animate-scale-in">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-700">
              {dealers.filter(d => d.status === 'Active').length}
            </div>
            <div className="text-sm text-purple-600">Active Dealers</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
