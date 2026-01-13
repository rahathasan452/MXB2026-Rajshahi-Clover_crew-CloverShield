'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Icon } from './Icon'
import { chatWithBot, ChatMessage } from '@/lib/ml-api'
import { toast } from 'react-hot-toast'
import { usePathname } from 'next/navigation'

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const toggleChat = () => setIsOpen(!isOpen)

  const handleReset = () => {
    setMessages([])
    setInputValue('')
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getPageContext = (path: string) => {
    if (path.includes('/dashboard/graph')) return "Network Graph (Customer 360). User is visualizing connections between accounts to find fraud rings."
    if (path.includes('/dashboard/simulator')) return "Fraud Scanner / Simulator. User is manually testing transactions or viewing the live feed."
    if (path.includes('/dashboard/cases')) return "Case Management. User is investigating specific cases or generating SARs."
    if (path.includes('/dashboard/policy')) return "Policy Lab. User is creating or backtesting fraud detection rules."
    if (path.includes('/dashboard/settings')) return "Settings & Audit Log. User is viewing system logs or configuring the workstation."
    if (path === '/dashboard') return "Mission Control Dashboard. User is viewing high-level KPIs and pending alerts."
    return `Unknown page: ${path}`
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, isOpen])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: ChatMessage = { role: 'user', content }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Pass the last few messages for context
      const contextMessages = [...messages, userMessage].slice(-6) 
      const pageContext = getPageContext(pathname)
      const response = await chatWithBot(contextMessages, `User is currently on page: ${pageContext}`)
      
      const botMessage: ChatMessage = { 
        role: 'assistant', 
        content: response.response 
      }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      toast.error('Failed to get response')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  const suggestions = [
    "How do I use the Scanner?",
    "Explain 'Smurfing' fraud",
    "What does a 'High Risk' score mean?",
    "How to use the Policy Lab?"
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto mb-4 w-80 sm:w-96 h-[500px] bg-card-bg border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-header p-4 flex justify-between items-center border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Icon name="smart_toy" className="text-primary" size={20} />
              </div>
              <h3 className="font-semibold text-text-primary">CloverShield AI</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleReset}
                className="text-text-secondary hover:text-white transition-colors"
                title="Reset Chat"
              >
                <Icon name="refresh" size={20} />
              </button>
              <button onClick={toggleChat} className="text-text-secondary hover:text-white transition-colors">
                <Icon name="close" size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center mt-10 space-y-4">
                <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto flex items-center justify-center">
                   <Icon name="forum" className="text-primary" size={32} />
                </div>
                <p className="text-text-secondary text-sm px-4">
                  Hi! I'm your fraud analysis assistant. Ask me anything about the platform or fraud patterns.
                </p>
                <div className="flex flex-wrap gap-2 justify-center px-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(s)}
                      className="text-xs bg-gray-800 hover:bg-gray-700 text-text-secondary hover:text-white px-3 py-1.5 rounded-full transition-colors border border-gray-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-lg p-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-gray-800 text-text-primary rounded-bl-none border border-gray-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg p-3 rounded-bl-none border border-gray-700">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-gray-900 border-t border-gray-800 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              className="bg-primary hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <Icon name="send" size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={toggleChat}
        className={`pointer-events-auto ${isOpen ? 'bg-gray-700' : 'bg-primary'} hover:brightness-110 text-white p-4 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center`}
        title="AI Assistant"
      >
        {isOpen ? <Icon name="expand_more" size={28} /> : <Icon name="smart_toy" size={28} />}
      </button>
    </div>
  )
}
