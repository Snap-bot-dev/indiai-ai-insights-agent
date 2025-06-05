
import { supabase } from '@/integrations/supabase/client';

interface QueryResult {
  type: 'sku' | 'claim' | 'sale' | 'general';
  data: any[];
  summary: string;
}

export class AIService {
  private openaiApiKey: string | null = null;

  setApiKey(apiKey: string) {
    this.openaiApiKey = apiKey;
    localStorage.setItem('openai_api_key', apiKey);
  }

  getApiKey(): string | null {
    if (!this.openaiApiKey) {
      this.openaiApiKey = localStorage.getItem('openai_api_key');
    }
    return this.openaiApiKey;
  }

  async processQuery(query: string, userRole: string = 'dealer'): Promise<string> {
    try {
      // First, try to get relevant data from database
      const results = await this.searchDatabase(query);
      
      // If we have an OpenAI API key, use it for better responses
      if (this.getApiKey()) {
        return await this.generateAIResponse(query, results, userRole);
      } else {
        return this.generateLocalResponse(query, results, userRole);
      }
    } catch (error) {
      console.error('Error processing query:', error);
      return "I'm sorry, I encountered an error while processing your request. Please try again.";
    }
  }

  private async searchDatabase(query: string): Promise<QueryResult> {
    const lowerQuery = query.toLowerCase();
    
    // Determine query type and search appropriate tables
    if (lowerQuery.includes('sku') || lowerQuery.includes('stock') || lowerQuery.includes('inventory') || lowerQuery.includes('product')) {
      const { data: skus, error } = await supabase
        .from('skus')
        .select('*')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);
      
      if (error) throw error;
      return { type: 'sku', data: skus || [], summary: this.summarizeSKUs(skus || []) };
    }
    
    if (lowerQuery.includes('claim') || lowerQuery.includes('warranty') || lowerQuery.includes('return')) {
      const { data: claims, error } = await supabase
        .from('claims')
        .select('*, dealers(name, region)')
        .or(`type.ilike.%${query}%,status.ilike.%${query}%`)
        .limit(10);
      
      if (error) throw error;
      return { type: 'claim', data: claims || [], summary: this.summarizeClaims(claims || []) };
    }
    
    if (lowerQuery.includes('sale') || lowerQuery.includes('revenue') || lowerQuery.includes('performance')) {
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*, dealers(name, region), skus(name, category)')
        .limit(10)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return { type: 'sale', data: sales || [], summary: this.summarizeSales(sales || []) };
    }

    // General search across all tables
    const [skus, claims, sales] = await Promise.all([
      supabase.from('skus').select('*').limit(3),
      supabase.from('claims').select('*, dealers(name)').limit(3),
      supabase.from('sales').select('*, dealers(name), skus(name)').limit(3)
    ]);

    return {
      type: 'general',
      data: { skus: skus.data || [], claims: claims.data || [], sales: sales.data || [] },
      summary: 'Here\'s an overview of your data'
    };
  }

  private async generateAIResponse(query: string, results: QueryResult, userRole: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return this.generateLocalResponse(query, results, userRole);
    }

    const systemPrompt = `You are a helpful AI assistant for a manufacturing company. You help users with SKU availability, claims status, and sales data. 
    
    User role: ${userRole}
    
    Be conversational, friendly, and provide actionable insights. Format your response clearly with bullet points or tables when showing data.
    
    Current data context: ${JSON.stringify(results.data).slice(0, 1000)}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          temperature: 0.7,
          max_tokens: 500
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('OpenAI API error:', data.error);
        return this.generateLocalResponse(query, results, userRole);
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return this.generateLocalResponse(query, results, userRole);
    }
  }

  private generateLocalResponse(query: string, results: QueryResult, userRole: string): string {
    if (results.data.length === 0) {
      return `I couldn't find any ${results.type} data matching your query "${query}". Please try different search terms or check if you have the right permissions to access this data.`;
    }

    const rolePrefix = this.getRolePrefix(userRole);
    
    switch (results.type) {
      case 'sku':
        return `${rolePrefix} Here are the SKUs I found for "${query}":\n\n${results.summary}`;
      case 'claim':
        return `${rolePrefix} Here are the claims matching "${query}":\n\n${results.summary}`;
      case 'sale':
        return `${rolePrefix} Here are the recent sales data:\n\n${results.summary}`;
      default:
        return `${rolePrefix} Here's what I found in your data:\n\n${results.summary}`;
    }
  }

  private getRolePrefix(userRole: string): string {
    switch (userRole) {
      case 'dealer':
        return "Hi there! As your business partner,";
      case 'sales_rep':
        return "Hello! Looking at your regional data,";
      case 'admin':
        return "Good day! From the system overview,";
      default:
        return "Hello!";
    }
  }

  private summarizeSKUs(skus: any[]): string {
    if (skus.length === 0) return 'No SKUs found.';
    
    return skus.map(sku => 
      `• ${sku.name} (${sku.id})\n  📦 Stock: ${sku.stock} units\n  📍 Location: ${sku.warehouse}, ${sku.zone}\n  💰 Price: ₹${sku.price.toLocaleString()}\n  📁 Category: ${sku.category}`
    ).join('\n\n');
  }

  private summarizeClaims(claims: any[]): string {
    if (claims.length === 0) return 'No claims found.';
    
    return claims.map(claim => 
      `• Claim ${claim.id}\n  🏢 Dealer: ${claim.dealer_name}\n  📊 Status: ${claim.status}\n  💰 Amount: ₹${claim.amount.toLocaleString()}\n  📋 Type: ${claim.type}\n  📅 Submitted: ${claim.submitted_date}`
    ).join('\n\n');
  }

  private summarizeSales(sales: any[]): string {
    if (sales.length === 0) return 'No sales found.';
    
    const totalAmount = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const summary = `Total: ₹${totalAmount.toLocaleString()} across ${sales.length} transactions\n\n`;
    
    const details = sales.slice(0, 5).map(sale => 
      `• ${sale.sku_name}\n  🏢 Dealer: ${sale.dealer_name}\n  📦 Qty: ${sale.quantity}\n  💰 Amount: ₹${sale.amount.toLocaleString()}\n  📅 Date: ${sale.date}`
    ).join('\n\n');
    
    return summary + details;
  }
}

export const aiService = new AIService();
