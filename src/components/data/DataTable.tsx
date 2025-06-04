
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '../../contexts/DataContext';
import { Search, Filter, Download } from 'lucide-react';

interface DataTableProps {
  userRole?: string;
}

const DataTable: React.FC<DataTableProps> = ({ userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('skus');
  const { skus, claims, sales, dealers } = useData();

  const filteredSKUs = skus.filter(sku =>
    sku.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sku.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sku.warehouse.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClaims = claims.filter(claim =>
    claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.dealerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSales = sales.filter(sale =>
    sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.dealerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.skuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDealers = dealers.filter(dealer =>
    dealer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'Pending': 'outline',
      'Approved': 'default',
      'Rejected': 'destructive',
      'Active': 'default',
      'Inactive': 'secondary'
    };
    
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const exportData = (data: any[], filename: string) => {
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          View and search through inventory, claims, sales, and dealer data
        </CardDescription>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const dataMap = {
                  skus: filteredSKUs,
                  claims: filteredClaims,
                  sales: filteredSales,
                  dealers: filteredDealers
                };
                exportData(dataMap[activeTab as keyof typeof dataMap], activeTab);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skus">SKUs ({filteredSKUs.length})</TabsTrigger>
            <TabsTrigger value="claims">Claims ({filteredClaims.length})</TabsTrigger>
            <TabsTrigger value="sales">Sales ({filteredSales.length})</TabsTrigger>
            <TabsTrigger value="dealers">Dealers ({filteredDealers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="skus" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU ID</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSKUs.slice(0, 50).map((sku) => (
                    <TableRow key={sku.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{sku.id}</TableCell>
                      <TableCell>{sku.name}</TableCell>
                      <TableCell>{sku.category}</TableCell>
                      <TableCell>{sku.warehouse}</TableCell>
                      <TableCell>{sku.zone}</TableCell>
                      <TableCell>
                        <span className={sku.stock < 50 ? 'text-red-600 font-semibold' : ''}>
                          {sku.stock}
                        </span>
                      </TableCell>
                      <TableCell>₹{sku.price.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="claims" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Dealer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Resolved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.slice(0, 50).map((claim) => (
                    <TableRow key={claim.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{claim.id}</TableCell>
                      <TableCell>{claim.dealerName}</TableCell>
                      <TableCell>₹{claim.amount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell>{claim.type}</TableCell>
                      <TableCell>{claim.submittedDate}</TableCell>
                      <TableCell>{claim.resolvedDate || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Dealer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.slice(0, 50).map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{sale.id}</TableCell>
                      <TableCell>{sale.dealerName}</TableCell>
                      <TableCell>{sale.skuName}</TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>₹{sale.amount.toLocaleString()}</TableCell>
                      <TableCell>{sale.region}</TableCell>
                      <TableCell>{sale.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="dealers" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dealer ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDealers.slice(0, 50).map((dealer) => (
                    <TableRow key={dealer.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{dealer.id}</TableCell>
                      <TableCell>{dealer.name}</TableCell>
                      <TableCell>{dealer.city}</TableCell>
                      <TableCell>{dealer.region}</TableCell>
                      <TableCell>{dealer.zone}</TableCell>
                      <TableCell>{dealer.contact}</TableCell>
                      <TableCell>{getStatusBadge(dealer.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DataTable;
