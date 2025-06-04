
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useData } from '../../contexts/DataContext';
import { Send, Bot, User, Lightbulb, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
}

interface ChatInterfaceProps {
  userRole?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userRole }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { searchSKU, searchClaims, searchSales, findSimilarQueries } = useData();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Suggested queries based on user role
  const getSuggestedQueries = () => {
    switch (userRole) {
      case 'dealer':
        return [
          "Check stock for SKU12345 in Chennai",
          "Show my pending claims",
          "What are my total sales this month?",
          "Which products are available in my region?"
        ];
      case 'sales_rep':
        return [
          "Show top performing dealers this quarter",
          "Which SKUs sold the most in Mumbai?",
          "Display regional sales comparison",
          "Show pending claims by region"
        ];
      case 'admin':
        return [
          "Overall sales performance this year",
          "Show all pending claims",
          "Which zones have low inventory?",
          "Top selling products across all regions"
        ];
      default:
        return [
          "Show SKU availability",
          "Check claim status",
          "Display sales data",
          "Show inventory levels"
        ];
    }
  };

  const processQuery = async (query: string): Promise<string> => {
    // Simulate AI processing with local data
    const lowerQuery = query.toLowerCase();
    
    // SKU-related queries
    if (lowerQuery.includes('sku') || lowerQuery.includes('stock') || lowerQuery.includes('inventory')) {
      const skuResults = searchSKU(query);
      if (skuResults.length > 0) {
        const topResults = skuResults.slice(0, 5);
        return `Found ${skuResults.length} SKUs matching your query:\n\n${topResults.map(sku => 
          `• ${sku.id} - ${sku.name}\n  Location: ${sku.warehouse}, ${sku.zone}\n  Stock: ${sku.stock} units\n  Price: ₹${sku.price.toLocaleString()}`
        ).join('\n\n')}${skuResults.length > 5 ? `\n\n...and ${skuResults.length - 5} more results` : ''}`;
      }
    }
    
    // Claims-related queries
    if (lowerQuery.includes('claim') || lowerQuery.includes('pending') || lowerQuery.includes('approved')) {
      const claimResults = searchClaims(query);
      if (claimResults.length > 0) {
        const topResults = claimResults.slice(0, 5);
        return `Found ${claimResults.length} claims:\n\n${topResults.map(claim => 
          `• Claim ${claim.id}\n  Dealer: ${claim.dealerName}\n  Status: ${claim.status}\n  Amount: ₹${claim.amount.toLocaleString()}\n  Type: ${claim.type}\n  Date: ${claim.submittedDate}`
        ).join('\n\n')}`;
      }
    }
    
    // Sales-related queries
    if (lowerQuery.includes('sales') || lowerQuery.includes('revenue') || lowerQuery.includes('performance')) {
      const salesResults = searchSales(query);
      if (salesResults.length > 0) {
        const totalAmount = salesResults.reduce((sum, sale) => sum + sale.amount, 0);
        const topResults = salesResults.slice(0, 5);
        return `Found ${salesResults.length} sales records with total revenue of ₹${totalAmount.toLocaleString()}:\n\n${topResults.map(sale => 
          `• Sale ${sale.id}\n  Dealer: ${sale.dealerName}\n  Product: ${sale.skuName}\n  Amount: ₹${sale.amount.toLocaleString()}\n  Region: ${sale.region}\n  Date: ${sale.date}`
        ).join('\n\n')}`;
      }
    }
    
    return "I understand your query, but I need more specific information to help you. Try asking about specific SKUs, claim IDs, or sales data with locations or dates.";
  };

  const callOpenAI = async (query: string, context: string): Promise<string> => {
    if (!apiKey) {
      throw new Error('OpenAI API key not provided');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for a manufacturing company in India. You help with SKU availability, claims management, and sales queries. 
            Context data: ${context}
            
            Provide helpful, accurate responses about inventory, claims, and sales. Use Indian currency (₹) and locations. Be professional but friendly.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API call failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let response: string;
      
      if (apiKey) {
        // Use OpenAI if API key is provided
        const localContext = await processQuery(input);
        response = await callOpenAI(input, localContext);
      } else {
        // Use local processing
        response = await processQuery(input);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        title: "Error",
        description: "Failed to process your query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuery = (query: string) => {
    setInput(query);
  };

  if (showApiKeyInput) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>AI Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Enter your OpenAI API key to enable advanced AI responses, or skip to use local processing:
            </p>
            <div className="flex space-x-2">
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => setShowApiKeyInput(false)}>
                {apiKey ? 'Use OpenAI' : 'Skip'}
              </Button>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            <p>• With OpenAI: Advanced natural language understanding</p>
            <p>• Without OpenAI: Local data processing and pattern matching</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chat Interface */}
      <div className="lg:col-span-2">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span>AI Assistant</span>
              <Badge variant="secondary">{apiKey ? 'OpenAI Powered' : 'Local Processing'}</Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Ask me anything about inventory, claims, or sales!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.type === 'assistant' && <Bot className="w-4 h-4 mt-1 text-blue-600" />}
                          {message.type === 'user' && <User className="w-4 h-4 mt-1" />}
                          <div className="flex-1">
                            <p className="whitespace-pre-line">{message.content}</p>
                            <p className="text-xs opacity-70 mt-2">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about SKUs, claims, sales..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={loading}
                />
                <Button onClick={handleSendMessage} disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggested Queries Sidebar */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5" />
              <span>Suggested Queries</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {getSuggestedQueries().map((query, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-left justify-start h-auto p-3 text-wrap"
                onClick={() => handleSuggestedQuery(query)}
                disabled={loading}
              >
                {query}
              </Button>
            ))}
          </CardContent>
        </Card>

        {apiKey && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">API Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">OpenAI Connected</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => {
                  setApiKey('');
                  setShowApiKeyInput(true);
                }}
              >
                Change API Key
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
