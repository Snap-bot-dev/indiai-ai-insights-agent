
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
  dealer_id: string;
  dealer_name: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  type: string;
  submitted_date: string;
  resolved_date?: string;
}

interface Sale {
  id: string;
  dealer_id: string;
  dealer_name: string;
  sku_id: string;
  sku_name: string;
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

      console.log('Starting data load...');

      // First, ensure data exists (migrate if needed)
      const migrationResult = await migrateDataToSupabase();
      console.log('Migration result:', migrationResult);

      // Load all data from Supabase
      const [skusResponse, claimsResponse, salesResponse, dealersResponse] = await Promise.all([
        supabase.from('skus').select('*'),
        supabase.from('claims').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('dealers').select('*')
      ]);

      if (skusResponse.error) {
        console.error('SKUs error:', skusResponse.error);
        throw skusResponse.error;
      }
      if (claimsResponse.error) {
        console.error('Claims error:', claimsResponse.error);
        throw claimsResponse.error;
      }
      if (salesResponse.error) {
        console.error('Sales error:', salesResponse.error);
        throw salesResponse.error;
      }
      if (dealersResponse.error) {
        console.error('Dealers error:', dealersResponse.error);
        throw dealersResponse.error;
      }

      setSKUs(skusResponse.data || []);
      setClaims(claimsResponse.data || []);
      setSales(salesResponse.data || []);
      setDealers(dealersResponse.data || []);

      console.log('Data loaded from Supabase successfully');
      console.log('SKUs count:', skusResponse.data?.length);
      console.log('Claims count:', claimsResponse.data?.length);
      console.log('Sales count:', salesResponse.data?.length);
      console.log('Dealers count:', dealersResponse.data?.length);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
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
