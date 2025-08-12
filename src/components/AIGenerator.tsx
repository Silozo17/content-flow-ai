import React, { useState } from 'react';
import {
  Send,
  Brain,
  Copy,
  Heart,
  Hash,
  FileText,
  Mic,
  Sparkles,
  Wand2,
  MessageSquare,
  Lightbulb,
  Target,
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  tags?: string[];
}

const AIGenerator: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "👋 Hey! I'm your AI content assistant. I can help you create hooks, captions, scripts, and more. What kind of content are you working on today?",
      timestamp: new Date(),
      tags: ['greeting']
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const promptTemplates = [
    {
      id: '1',
      title: 'Hook Generator',
      prompt: 'Create 5 scroll-stopping hooks for a [industry] about [topic]',
      icon: Target,
      color: 'blue'
    },
    {
      id: '2',
      title: 'Script Writer',
      prompt: 'Write a 60-second script for [platform] about [topic] using [formula]',
      icon: FileText,
      color: 'green'
    },
    {
      id: '3',
      title: 'Caption Creator',
      prompt: 'Create an engaging caption with CTA for [platform] post about [topic]',
      icon: MessageSquare,
      color: 'purple'
    },
    {
      id: '4',
      title: 'Content Ideas',
      prompt: 'Give me 10 content ideas for [industry] targeting [audience] this week',
      icon: Lightbulb,
      color: 'orange'
    },
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(input),
        timestamp: new Date(),
        tags: ['hook', 'script', 'caption']
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (prompt: string) => {
    if (prompt.toLowerCase().includes('hook')) {
      return `🎯 **Here are 5 scroll-stopping hooks for your content:**

**Hook 1:** "The biggest mistake I made as a [profession] cost me $10K..."
*Perfect for: Story-driven content with a lesson*

**Hook 2:** "Everyone thinks [common belief], but here's what actually works..."
*Perfect for: Myth-busting content*

**Hook 3:** "I tried [trending thing] for 30 days. Here's what happened..."
*Perfect for: Challenge/experiment content*

**Hook 4:** "The [number] signs you're ready to [achievement]..."
*Perfect for: Educational/list content*

**Hook 5:** "POV: You just discovered the [tool/hack] that changed everything..."
*Perfect for: Tool/hack reveals*

💡 **Pro tip:** Test these hooks with different audiences and track which one gets the highest engagement!`;
    }

    return `✨ **Here's your AI-generated content:**

Based on your request, I've created customized content that's optimized for engagement and conversion. Each piece is designed to capture attention in the first 3 seconds and drive action.

**Script Structure:**
- Hook (0-3s): Attention grabber
- Value (4-45s): Main content/teaching
- CTA (46-60s): Clear next step

**Caption Elements:**
- Compelling opening line
- Value-driven body text
- Strategic hashtags
- Clear call-to-action

Would you like me to refine any part of this content or create variations for different platforms?`;
  };

  const handleTemplateClick = (prompt: string) => {
    setInput(prompt);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Content Generator</h1>
            <p className="text-gray-600">Powered by GPT-4o</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-600">AI Online</span>
        </div>
      </div>

      {/* Template Quick Actions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span>Quick Templates</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {promptTemplates.map((template) => {
            const Icon = template.icon;
            const colorClasses = {
              blue: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50',
              green: 'border-green-200 hover:border-green-300 hover:bg-green-50',
              purple: 'border-purple-200 hover:border-purple-300 hover:bg-purple-50',
              orange: 'border-orange-200 hover:border-orange-300 hover:bg-orange-50',
            };

            return (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template.prompt)}
                className={`p-4 bg-white border rounded-lg text-left transition-all duration-200 ${colorClasses[template.color as keyof typeof colorClasses]}`}
              >
                <Icon className="w-5 h-5 text-gray-600 mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">{template.title}</h4>
                <p className="text-xs text-gray-600 line-clamp-2">{template.prompt}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-3xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`rounded-2xl p-4 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.tags && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white/20 rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.type === 'ai' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(message.content)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-red-500 transition-colors">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me to create hooks, scripts, captions, or anything else..."
                className="w-full p-4 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <button className="absolute bottom-3 right-3 text-gray-400 hover:text-gray-600 transition-colors">
                <Mic className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl flex items-center justify-center hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGenerator;