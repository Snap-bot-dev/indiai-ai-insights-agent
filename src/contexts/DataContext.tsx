
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SKU {
  id: string;
  name: string;
  category: string;
  zone: string;
  warehouse: string;
  stock: number;
  price: number;
  description: string;
}

interface Claim {
  id: string;
  dealerId: string;
  dealerName: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  type: string;
  submittedDate: string;
  resolvedDate?: string;
}

interface Sale {
  id: string;
  dealerId: string;
  dealerName: string;
  skuId: string;
  skuName: string;
  quantity: number;
  amount: number;
  date: string;
  region: string;
  zone: string;
}

interface Dealer {
  id: string;
  name: string;
  region: string;
  zone: string;
  city: string;
  contact: string;
  status: 'Active' | 'Inactive';
}

interface DataContextType {
  skus: SKU[];
  claims: Claim[];
  sales: Sale[];
  dealers: Dealer[];
  searchSKU: (query: string) => SKU[];
  searchClaims: (query: string) => Claim[];
  searchSales: (query: string) => Sale[];
  generateEmbedding: (text: string) => number[];
  findSimilarQueries: (query: string) => string[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock data generators
const generateSKUs = (): SKU[] => {
  const categories = ['Electronics', 'Appliances', 'Tools', 'Components', 'Accessories'];
  const zones = ['North', 'South', 'East', 'West', 'Central'];
  const warehouses = ['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Pune', 'Hyderabad'];
  
  return Array.from({ length: 300 }, (_, i) => ({
    id: `SKU${String(i + 1).padStart(5, '0')}`,
    name: `Product ${i + 1}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    zone: zones[Math.floor(Math.random() * zones.length)],
    warehouse: warehouses[Math.floor(Math.random() * warehouses.length)],
    stock: Math.floor(Math.random() * 1000),
    price: Math.floor(Math.random() * 50000) + 1000,
    description: `High-quality ${categories[Math.floor(Math.random() * categories.length)].toLowerCase()} product`
  }));
};

const generateClaims = (): Claim[] => {
  const statuses: ('Pending' | 'Approved' | 'Rejected')[] = ['Pending', 'Approved', 'Rejected'];
  const types = ['Warranty', 'Return', 'Damage', 'Quality Issue'];
  const dealers = ['Raj Electronics', 'Kumar Traders', 'Sharma Industries', 'Patel Corp'];
  
  return Array.from({ length: 100 }, (_, i) => ({
    id: `CLM${String(i + 1).padStart(5, '0')}`,
    dealerId: `D${String(Math.floor(i / 4) + 1).padStart(3, '0')}`,
    dealerName: dealers[i % dealers.length],
    amount: Math.floor(Math.random() * 100000) + 5000,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    type: types[Math.floor(Math.random() * types.length)],
    submittedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    resolvedDate: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined
  }));
};

const generateSales = (): Sale[] => {
  const dealers = ['Raj Electronics', 'Kumar Traders', 'Sharma Industries', 'Patel Corp'];
  const regions = ['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Kolkata'];
  const zones = ['North', 'South', 'East', 'West', 'Central'];
  
  return Array.from({ length: 1000 }, (_, i) => ({
    id: `SAL${String(i + 1).padStart(5, '0')}`,
    dealerId: `D${String(Math.floor(i / 40) + 1).padStart(3, '0')}`,
    dealerName: dealers[i % dealers.length],
    skuId: `SKU${String(Math.floor(Math.random() * 300) + 1).padStart(5, '0')}`,
    skuName: `Product ${Math.floor(Math.random() * 300) + 1}`,
    quantity: Math.floor(Math.random() * 20) + 1,
    amount: Math.floor(Math.random() * 200000) + 10000,
    date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    region: regions[Math.floor(Math.random() * regions.length)],
    zone: zones[Math.floor(Math.random() * zones.length)]
  }));
};

const generateDealers = (): Dealer[] => {
  const cities = ['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Pune', 'Hyderabad'];
  const zones = ['North', 'South', 'East', 'West', 'Central'];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: `D${String(i + 1).padStart(3, '0')}`,
    name: `Dealer ${i + 1}`,
    region: cities[Math.floor(Math.random() * cities.length)],
    zone: zones[Math.floor(Math.random() * zones.length)],
    city: cities[Math.floor(Math.random() * cities.length)],
    contact: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    status: Math.random() > 0.1 ? 'Active' : 'Inactive'
  }));
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [skus, setSKUs] = useState<SKU[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);

  useEffect(() => {
    // Initialize data
    setSKUs(generateSKUs());
    setClaims(generateClaims());
    setSales(generateSales());
    setDealers(generateDealers());
  }, []);

  // Simple text embedding simulation
  const generateEmbedding = (text: string): number[] => {
    const words = text.toLowerCase().split(' ');
    const embedding = new Array(384).fill(0);
    
    words.forEach((word, i) => {
      for (let j = 0; j < word.length && j < embedding.length; j++) {
        embedding[j] += word.charCodeAt(j % word.length) * (i + 1);
      }
    });
    
    return embedding.map(val => val / 1000);
  };

  const findSimilarQueries = (query: string): string[] => {
    const commonQueries = [
      "Show me SKU availability in Chennai",
      "What's the status of my recent claims?",
      "Display sales data for this month",
      "Which products are low in stock?",
      "Show pending claims for approval"
    ];
    
    return commonQueries.filter(q => 
      q.toLowerCase().includes(query.toLowerCase()) || 
      query.toLowerCase().includes(q.toLowerCase())
    );
  };

  const searchSKU = (query: string): SKU[] => {
    return skus.filter(sku => 
      sku.id.toLowerCase().includes(query.toLowerCase()) ||
      sku.name.toLowerCase().includes(query.toLowerCase()) ||
      sku.category.toLowerCase().includes(query.toLowerCase()) ||
      sku.zone.toLowerCase().includes(query.toLowerCase()) ||
      sku.warehouse.toLowerCase().includes(query.toLowerCase())
    );
  };

  const searchClaims = (query: string): Claim[] => {
    return claims.filter(claim =>
      claim.id.toLowerCase().includes(query.toLowerCase()) ||
      claim.dealerName.toLowerCase().includes(query.toLowerCase()) ||
      claim.status.toLowerCase().includes(query.toLowerCase()) ||
      claim.type.toLowerCase().includes(query.toLowerCase())
    );
  };

  const searchSales = (query: string): Sale[] => {
    return sales.filter(sale =>
      sale.dealerName.toLowerCase().includes(query.toLowerCase()) ||
      sale.skuName.toLowerCase().includes(query.toLowerCase()) ||
      sale.region.toLowerCase().includes(query.toLowerCase()) ||
      sale.zone.toLowerCase().includes(query.toLowerCase())
    );
  };

  return (
    <DataContext.Provider value={{
      skus,
      claims,
      sales,
      dealers,
      searchSKU,
      searchClaims,
      searchSales,
      generateEmbedding,
      findSimilarQueries
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
