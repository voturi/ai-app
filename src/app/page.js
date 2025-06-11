"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const modelMenuRef = useRef(null);

  // Close drop-up when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target)) {
        setShowModelMenu(false);
      }
    }
    if (showModelMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModelMenu]);

  // Handle input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("/api/completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: input,
          systemMessage: "You are a helpful assistant.",
          model: selectedModel
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to fetch response");
      }

      // Read the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";

      // Add assistant message placeholder
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        // Update the last message (assistant's message)
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = result;
          return newMessages;
        });
      }
    } catch (err) {
      console.error("Frontend error:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className={`transition-all duration-300 bg-gray-800 flex flex-col ${isSidebarOpen ? 'w-64 border-r border-gray-700' : 'w-14'}`}>
        {/* Hamburger icon only visible in sidebar when open */}
        {isSidebarOpen && (
          <div className="flex items-center justify-center h-16 border-b border-gray-700">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-gray-700 rounded-lg"
              aria-label="Close sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        )}
        {/* Sidebar content only if open */}
        {isSidebarOpen && (
          <>
            <div className="p-4 border-b border-gray-700">
              <button
                className="w-full px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800"
              >
                New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {/* Placeholder for chat history */}
                <div className="text-gray-400 text-sm">Recent Conversations</div>
                <div className="text-gray-500 text-sm">No conversations yet</div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="text-sm text-gray-400">Model: GPT-3.5</div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`border-b border-gray-700 p-4 flex items-center ${!isSidebarOpen ? 'border-l border-gray-700' : ''}`}>
          {/* Hamburger in header only if sidebar is collapsed */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="mr-4 p-2 hover:bg-gray-700 rounded-lg"
              aria-label="Open sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-semibold">AI Playground</h1>
        </header>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Start a conversation...
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-teal-700"
                      : "bg-gray-700"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className="bg-gray-800 rounded px-1 py-0.5" {...props}>
                                {children}
                              </code>
                            );
                          },
                          p: ({ children }) => <p className="mb-4">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-teal-500 pl-4 italic my-4">
                              {children}
                            </blockquote>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full border-collapse border border-gray-600">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="border border-gray-600 px-4 py-2 bg-gray-800">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-gray-600 px-4 py-2">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-start">
              <div className="bg-red-900 rounded-lg p-4 text-red-200">
                {error.message}
              </div>
            </div>
          )}
        </div>

        {/* Input form with drop-up */}
        <div className="border-t border-gray-700 p-2">
          <form onSubmit={handleSubmit} className="flex gap-2 items-end relative">
            <input
              type="text"
              value={input}
              placeholder="Type your message..."
              onChange={handleInputChange}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-1 focus:outline-none focus:border-teal-500"
            />
            <div className="relative flex flex-col items-end" ref={modelMenuRef}>
              <button
                type="button"
                className="px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-teal-300 hover:bg-gray-700 flex items-center mb-1"
                onClick={() => setShowModelMenu((v) => !v)}
                disabled={isLoading}
                aria-label="Select model"
              >
                <span className="mr-1 text-xs font-medium">{
                  ([
                    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
                    { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
                    { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
                    { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
                    { label: 'Claude 3 Haiku', value: 'claude-3-haiku' },
                    { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet' },
                    { label: 'Claude 3 Opus', value: 'claude-3-opus' },
                  ].find(m => m.value === selectedModel)?.label || selectedModel
                )}
                </span>
                <svg className={`w-4 h-4 transition-transform ${showModelMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showModelMenu && (
                <div className="absolute bottom-12 right-0 mb-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 animate-fadeInUp">
                  <ul className="py-1">
                    {[
                      { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
                      { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
                      { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
                      { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
                      { label: 'Claude 3 Haiku', value: 'claude-3-haiku' },
                      { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet' },
                      { label: 'Claude 3 Opus', value: 'claude-3-opus' },
                    ].map((model) => (
                      <li key={model.value}>
                        <button
                          type="button"
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-teal-800 rounded ${selectedModel === model.value ? 'bg-teal-700 text-white' : 'text-teal-200'}`}
                          onClick={() => { setSelectedModel(model.value); setShowModelMenu(false); }}
                        >
                          {model.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}