import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { migrateDataToSupabase } from '../services/dataMigration';

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
  searchSKU: (query: string) => Promise<SKU[]>;
  searchClaims: (query: string) => Promise<Claim[]>;
  searchSales: (query: string) => Promise<Sale[]>;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, ensure data exists (migrate if needed)
      await migrateDataToSupabase();

      // Load all data from Supabase
      const [skusResponse, claimsResponse, salesResponse, dealersResponse] = await Promise.all([
        supabase.from('skus').select('*'),
        supabase.from('claims').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('dealers').select('*')
      ]);

      if (skusResponse.error) throw skusResponse.error;
      if (claimsResponse.error) throw claimsResponse.error;
      if (salesResponse.error) throw salesResponse.error;
      if (dealersResponse.error) throw dealersResponse.error;

      setSKUs(skusResponse.data || []);
      setClaims(claimsResponse.data || []);
      setSales(salesResponse.data || []);
      setDealers(dealersResponse.data || []);

      console.log('Data loaded from Supabase successfully');
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const searchSKU = async (query: string): Promise<SKU[]> => {
    try {
      const { data, error } = await supabase
        .from('skus')
        .select('*')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`);
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching SKUs:', err);
      return [];
    }
  };

  const searchClaims = async (query: string): Promise<Claim[]> => {
    try {
      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .or(`dealer_name.ilike.%${query}%,status.ilike.%${query}%,type.ilike.%${query}%`);
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching claims:', err);
      return [];
    }
  };

  const searchSales = async (query: string): Promise<Sale[]> => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .or(`dealer_name.ilike.%${query}%,sku_name.ilike.%${query}%,region.ilike.%${query}%,zone.ilike.%${query}%`);
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching sales:', err);
      return [];
    }
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
      isLoading,
      error,
      refreshData: loadData
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
