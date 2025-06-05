
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useData } from '../../contexts/DataContext';
import { aiService } from '../../services/aiService';
import { Send, Bot, User, Lightbulb, Key } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatInterfaceProps {
  userRole?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userRole = 'dealer' }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello! I'm your AI assistant here to help you with SKU availability, claims status, and sales data. I'm connected to your live database and can provide real-time insights. What would you like to know today?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const { isLoading: dataLoading, error: dataError } = useData();

  const suggestedQueries = [
    "Show me low stock products",
    "What are my pending claims?",
    "Display this month's sales performance",
    "Which products are popular in Chennai?",
    "Show warranty claims from last week"
  ];

  useEffect(() => {
    // Check if API key exists
    const existingKey = aiService.getApiKey();
    if (!existingKey) {
      setShowApiKeyInput(true);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Use the AI service to process the query
      const response = await aiService.processQuery(inputMessage, userRole);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I encountered an issue processing your request. Please try again or contact support if the problem persists.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeySubmit = () => {
    if (apiKeyInput.trim()) {
      aiService.setApiKey(apiKeyInput.trim());
      setShowApiKeyInput(false);
      setApiKeyInput('');
      
      // Add a confirmation message
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        content: "Great! I've saved your OpenAI API key. I can now provide more intelligent and context-aware responses. Feel free to ask me anything about your business data!",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmationMessage]);
    }
  };

  const handleSuggestedQuery = (query: string) => {
    setInputMessage(query);
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading data: {dataError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Chat Interface */}
      <div className="lg:col-span-3">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <span>AI Assistant</span>
              <Badge variant="secondary">{userRole}</Badge>
              {aiService.getApiKey() && (
                <Badge variant="outline" className="text-green-600">
                  <Key className="w-3 h-3 mr-1" />
                  Enhanced AI
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Ask me about your business data using natural language. I'm connected to your live database!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border shadow-sm'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.sender === 'bot' && <Bot className="w-4 h-4 mt-1 text-blue-600" />}
                      {message.sender === 'user' && <User className="w-4 h-4 mt-1" />}
                      <div className="whitespace-pre-line">{message.content}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border p-3 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">Analyzing your data...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about products, claims, sales, or anything else..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
              />
              <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Sidebar */}
      <div className="space-y-4">
        {/* Suggested Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <span>Try asking...</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedQueries.map((query, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full text-left justify-start h-auto p-3 hover:bg-blue-50"
                onClick={() => handleSuggestedQuery(query)}
              >
                {query}
              </Button>
            ))}
          </CardContent>
        </Card>
        
        {/* API Key Configuration */}
        {showApiKeyInput && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Enhance AI Responses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="password"
                placeholder="Enter OpenAI API Key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="text-xs"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleApiKeySubmit} className="flex-1">
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowApiKeyInput(false)}>
                  Skip
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                Optional: Add your OpenAI API key for more intelligent, context-aware responses.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
