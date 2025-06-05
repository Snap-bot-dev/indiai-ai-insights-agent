
import { supabase } from '@/integrations/supabase/client';

// Mock data generators (same as before but for database insertion)
const generateDealers = () => {
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

const generateSKUs = () => {
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

const generateClaims = (dealers: any[]) => {
  const statuses = ['Pending', 'Approved', 'Rejected'];
  const types = ['Warranty', 'Return', 'Damage', 'Quality Issue'];
  
  return Array.from({ length: 100 }, (_, i) => {
    const dealer = dealers[i % dealers.length];
    return {
      id: `CLM${String(i + 1).padStart(5, '0')}`,
      dealer_id: dealer.id,
      dealer_name: dealer.name,
      amount: Math.floor(Math.random() * 100000) + 5000,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      type: types[Math.floor(Math.random() * types.length)],
      submitted_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      resolved_date: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
    };
  });
};

const generateSales = (dealers: any[], skus: any[]) => {
  return Array.from({ length: 1000 }, (_, i) => {
    const dealer = dealers[i % dealers.length];
    const sku = skus[Math.floor(Math.random() * skus.length)];
    return {
      id: `SAL${String(i + 1).padStart(5, '0')}`,
      dealer_id: dealer.id,
      dealer_name: dealer.name,
      sku_id: sku.id,
      sku_name: sku.name,
      quantity: Math.floor(Math.random() * 20) + 1,
      amount: Math.floor(Math.random() * 200000) + 10000,
      date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      region: dealer.region,
      zone: dealer.zone
    };
  });
};

export const migrateDataToSupabase = async () => {
  try {
    console.log('Starting data migration...');
    
    // Check if data already exists
    const { data: existingDealers, error: checkError } = await supabase.from('dealers' as any).select('id').limit(1);
    
    if (checkError) {
      console.log('Tables may not exist yet or migration needed. Error:', checkError.message);
    }
    
    if (existingDealers && existingDealers.length > 0) {
      console.log('Data already exists, skipping migration');
      return { success: true, message: 'Data already migrated' };
    }

    console.log('Generating mock data...');
    // Generate mock data
    const dealers = generateDealers();
    const skus = generateSKUs();
    const claims = generateClaims(dealers);
    const sales = generateSales(dealers, skus);

    console.log('Inserting dealers...');
    // Insert dealers
    const { error: dealersError } = await supabase.from('dealers' as any).insert(dealers);
    if (dealersError) {
      console.error('Dealers insert error:', dealersError);
      throw dealersError;
    }
    console.log('Dealers inserted successfully');

    console.log('Inserting SKUs...');
    // Insert SKUs
    const { error: skusError } = await supabase.from('skus' as any).insert(skus);
    if (skusError) {
      console.error('SKUs insert error:', skusError);
      throw skusError;
    }
    console.log('SKUs inserted successfully');

    console.log('Inserting claims...');
    // Insert claims
    const { error: claimsError } = await supabase.from('claims' as any).insert(claims);
    if (claimsError) {
      console.error('Claims insert error:', claimsError);
      throw claimsError;
    }
    console.log('Claims inserted successfully');

    console.log('Inserting sales...');
    // Insert sales
    const { error: salesError } = await supabase.from('sales' as any).insert(sales);
    if (salesError) {
      console.error('Sales insert error:', salesError);
      throw salesError;
    }
    console.log('Sales inserted successfully');

    // Generate embeddings for SKUs, claims, and sales data
    console.log('Generating embeddings...');
    await generateEmbeddings(skus, claims, sales);

    console.log('Data migration completed successfully');
    return { success: true, message: 'Data migrated successfully' };
  } catch (error: any) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message || 'Migration failed' };
  }
};

const generateEmbeddings = async (skus: any[], claims: any[], sales: any[]) => {
  try {
    const documents = [];
    
    // Create documents from SKUs
    skus.forEach(sku => {
      documents.push({
        content: `SKU ${sku.id}: ${sku.name} in ${sku.category} category. Available in ${sku.warehouse} warehouse, ${sku.zone} zone. Stock: ${sku.stock} units. Price: ₹${sku.price}. ${sku.description}`,
        metadata: { type: 'sku', id: sku.id, category: sku.category, zone: sku.zone },
        document_type: 'sku'
      });
    });

    // Create documents from claims
    claims.forEach(claim => {
      documents.push({
        content: `Claim ${claim.id} by ${claim.dealer_name}. Type: ${claim.type}. Status: ${claim.status}. Amount: ₹${claim.amount}. Submitted: ${claim.submitted_date}`,
        metadata: { type: 'claim', id: claim.id, dealer_id: claim.dealer_id, status: claim.status },
        document_type: 'claim'
      });
    });

    // Create documents from sales
    sales.slice(0, 100).forEach(sale => { // Limit to first 100 for performance
      documents.push({
        content: `Sale ${sale.id}: ${sale.sku_name} sold by ${sale.dealer_name}. Quantity: ${sale.quantity}. Amount: ₹${sale.amount}. Region: ${sale.region}, Zone: ${sale.zone}. Date: ${sale.date}`,
        metadata: { type: 'sale', id: sale.id, dealer_id: sale.dealer_id, sku_id: sale.sku_id },
        document_type: 'sale'
      });
    });

    // Generate simple embeddings (in production, use OpenAI embeddings)
    const documentsWithEmbeddings = documents.map(doc => ({
      ...doc,
      embedding: generateSimpleEmbedding(doc.content)
    }));

    // Insert embeddings in batches
    const batchSize = 50;
    for (let i = 0; i < documentsWithEmbeddings.length; i += batchSize) {
      const batch = documentsWithEmbeddings.slice(i, i + batchSize);
      const { error } = await supabase.from('document_embeddings' as any).insert(batch);
      if (error) {
        console.error('Error inserting embeddings batch:', error);
      }
    }
    
    console.log('Embeddings generated and stored');
  } catch (error) {
    console.error('Error generating embeddings:', error);
  }
};

// Simple embedding generation (replace with OpenAI in production)
const generateSimpleEmbedding = (text: string): number[] => {
  const words = text.toLowerCase().split(' ');
  const embedding = new Array(384).fill(0);
  
  words.forEach((word, i) => {
    for (let j = 0; j < word.length && j < embedding.length; j++) {
      embedding[j] += word.charCodeAt(j % word.length) * (i + 1);
    }
  });
  
  return embedding.map(val => val / 1000);
};
