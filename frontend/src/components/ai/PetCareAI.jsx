import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Heart, MessageCircle, ArrowLeft } from 'lucide-react';

const PetCareAI = ({ onBack }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "👋 Hi! I'm Jake, your AI pet care expert! I'm here to help with any questions about grooming, health, behavior, and caring for your furry friends. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Pet care knowledge base - this would typically come from an AI service
  const generateAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Grooming-related responses
    if (message.includes('groom') || message.includes('brush') || message.includes('bath')) {
      const groomingResponses = [
        "🛁 Great question about grooming! Regular grooming is essential for your pet's health and happiness. At Jake's Bath House, we recommend:\n\n• **Dogs**: Every 4-6 weeks for most breeds\n• **Long-haired pets**: Every 3-4 weeks\n• **Short-haired pets**: Every 6-8 weeks\n\nWould you like to schedule a grooming appointment? Our professionals can assess your pet's specific needs!",
        "✨ Grooming isn't just about looking good - it's about health! Regular grooming helps:\n\n• Prevent matting and skin issues\n• Early detection of lumps or problems\n• Reduce shedding at home\n• Keep nails at proper length\n\nOur experienced groomers at Jake's Bath House can create a custom grooming plan for your pet!",
        "🐕 The key to successful grooming is starting early and making it positive! Here are my tips:\n\n• Start with short sessions\n• Use treats and praise\n• Let them get used to being touched\n• Make it a bonding experience\n\nIf your pet is anxious about grooming, our gentle approach at Jake's Bath House can help them feel comfortable!"
      ];
      return groomingResponses[Math.floor(Math.random() * groomingResponses.length)];
    }
    
    // Health-related responses
    if (message.includes('health') || message.includes('sick') || message.includes('vet') || message.includes('medical')) {
      return "🏥 Pet health is so important! While I can provide general guidance, always consult your veterinarian for medical concerns. Here are some signs to watch for:\n\n**See a vet if you notice:**\n• Loss of appetite for 24+ hours\n• Lethargy or unusual behavior\n• Vomiting or diarrhea\n• Difficulty breathing\n• Limping or signs of pain\n\n**For routine care:**\n• Regular grooming helps spot health issues early\n• Keep up with vaccinations\n• Maintain dental hygiene\n\nRemember, a well-groomed pet is easier to examine for health issues!";
    }
    
    // Behavior-related responses
    if (message.includes('behavior') || message.includes('training') || message.includes('bark') || message.includes('bite')) {
      return "🎾 Pet behavior questions are so common! Most behavioral issues stem from:\n\n• **Lack of exercise** - Tired pets are good pets!\n• **Inconsistent routine** - Pets thrive on predictability\n• **Boredom** - Mental stimulation is key\n• **Anxiety** - Often helped by regular grooming routine\n\n**Quick tips:**\n• Positive reinforcement works best\n• Consistency is everything\n• Exercise before training\n• Consider professional help for serious issues\n\nRegular grooming can actually help with anxiety - the routine and gentle touch are very calming!";
    }
    
    // Nutrition-related responses
    if (message.includes('food') || message.includes('eat') || message.includes('nutrition') || message.includes('diet')) {
      return "🍽️ Good nutrition is the foundation of pet health! Here's what I recommend:\n\n**For Dogs:**\n• High-quality protein as first ingredient\n• Age-appropriate formula (puppy, adult, senior)\n• Avoid foods toxic to dogs (chocolate, grapes, etc.)\n\n**For Cats:**\n• Higher protein needs than dogs\n• Wet food helps with hydration\n• Avoid onions, garlic, lilies\n\n**General tips:**\n• Consistent feeding schedule\n• Fresh water always available\n• Monitor weight and adjust portions\n\nA healthy diet shows in their coat - which we definitely notice during grooming sessions!";
    }
    
    // Appointment/service related
    if (message.includes('appointment') || message.includes('book') || message.includes('schedule') || message.includes('price')) {
      return "📅 I'd love to help you schedule an appointment! Jake's Bath House offers:\n\n**🛁 Self-Service DIY Wash**\n• Perfect for regular maintenance\n• All supplies provided\n• Great bonding time with your pet\n\n**✨ Professional Grooming**\n• Full-service grooming by experts\n• Breed-specific cuts\n• Nail trimming, ear cleaning, and more\n\n**📸 Photo Package**\n• Before & after photos\n• Show off your pet's transformation!\n\nWould you like to know more about any of these services? I can help you choose what's best for your pet!";
    }
    
    // General pet care
    if (message.includes('care') || message.includes('tip') || message.includes('advice')) {
      return "💕 Here are my top pet care tips for happy, healthy pets:\n\n**Daily Care:**\n• Fresh water and quality food\n• Regular exercise and playtime\n• Lots of love and attention!\n\n**Weekly Care:**\n• Brush their coat (more for long-haired pets)\n• Check ears, eyes, and paws\n• Basic training practice\n\n**Monthly Care:**\n• Professional grooming or DIY wash\n• Nail trimming if needed\n• Weight check\n\n**The secret:** Consistency is key! Regular grooming not only keeps them clean but also helps you spot any health issues early. That's why we love what we do at Jake's Bath House!";
    }
    
    // Default responses for unclear questions
    const defaultResponses = [
      "🤔 That's an interesting question! Could you tell me a bit more? I'm here to help with:\n\n• **Grooming advice** - When, how often, techniques\n• **Health questions** - General wellness tips\n• **Behavior help** - Training and behavioral guidance\n• **Nutrition guidance** - Diet and feeding tips\n• **Jake's Bath House services** - Our offerings\n\nWhat specific aspect would you like to explore?",
      "🐾 I'd love to help you with that! I specialize in:\n\n• Grooming and hygiene care\n• Pet health and wellness\n• Behavioral training tips\n• Nutrition and feeding advice\n• Jake's Bath House services\n\nCould you be a bit more specific about what you'd like to know?",
      "✨ Great question! I'm your go-to expert for all things pet care. Whether it's about grooming, health, behavior, or nutrition - I'm here to help!\n\nWhat's on your mind about your furry friend today?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateAIResponse(currentMessage),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const quickQuestions = [
    "How often should I groom my dog?",
    "What are signs my pet needs a bath?",
    "How do I help my anxious pet during grooming?",
    "What's included in professional grooming?",
    "When should I trim my pet's nails?"
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 p-4">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">Jake - Pet Care AI</h1>
              <p className="text-sm text-green-600 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Online & Ready to Help
              </p>
            </div>
          </div>
          
          <div className="ml-auto">
            <Sparkles className="h-5 w-5 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow-lg border border-gray-100'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'ai' && (
                  <div className="flex-shrink-0">
                    <Bot className="h-4 w-4 text-purple-600 mt-1" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {message.content}
                  </p>
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
                {message.type === 'user' && (
                  <div className="flex-shrink-0">
                    <User className="h-4 w-4 text-blue-100 mt-1" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-lg border border-gray-100 px-4 py-3 rounded-2xl max-w-xs">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-purple-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <MessageCircle className="h-4 w-4 mr-2 text-blue-600" />
              Popular Questions
            </h3>
            <div className="space-y-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMessage(question)}
                  className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Jake anything about pet care..."
              rows="1"
              className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isTyping}
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetCareAI;