'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { petService, chatService, Pet, ChatMessage } from '@/lib/api';
import { Send, ArrowLeft, Trash2, PawPrint, MessageSquare, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ChatPage() {
    const { petId }: { petId: string } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const [pet, setPet] = useState<Pet | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user && petId) {
            init();
        }
    }, [user, petId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const init = async () => {
        try {
            const [petRes, historyRes] = await Promise.all([
                petService.getPet(petId),
                chatService.getHistory(petId)
            ]);
            setPet(petRes.data);
            setMessages(historyRes.data.messages || []);
        } catch (error) {
            console.error('Failed to initialize chat:', error);
            // router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || isTyping) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: inputText,
            timestamp: new Date().toISOString()
        };

        setMessages([...messages, userMessage]);
        const currentInput = inputText;
        setInputText('');
        setIsTyping(true);

        try {
            const response = await chatService.sendMessage(petId, currentInput);
            const petResponse: ChatMessage = {
                role: 'pet',
                content: response.data.message,
                timestamp: response.data.timestamp
            };
            setMessages(prev => [...prev, petResponse]);
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Your pet is taking a nap. Try again in a moment.');
        } finally {
            setIsTyping(false);
        }
    };

    const handleClearHistory = async () => {
        if (!confirm('Clear all chat history for this pet?')) return;
        try {
            await chatService.clearHistory(petId);
            setMessages([]);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-slate-950">
            {/* Header */}
            <header className="glass relative z-10 flex items-center justify-between border-b border-slate-800/50 px-6 py-4 shadow-xl">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-slate-400 transition hover:text-sky-400">
                        <ArrowLeft size={24} />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="bg-sky-500/20 flex h-10 w-10 items-center justify-center rounded-xl text-sky-400">
                            <PawPrint size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-white leading-tight">{pet?.name || 'Pet'}</h2>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Online</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleClearHistory}
                    className="text-slate-500 transition hover:text-red-400"
                    title="Clear History"
                >
                    <Trash2 size={20} />
                </button>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto px-4 py-8 md:px-6 lg:px-8 custom-scrollbar">
                <div className="mx-auto max-w-4xl space-y-6">
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="bg-slate-900/50 mb-4 rounded-3xl p-6 text-slate-600 border border-slate-800">
                            <MessageSquare size={48} />
                        </div>
                        <h3 className="text-lg font-semibold text-white">This is the start of your chat with {pet?.name}</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-xs">Everything you say will be characterfully ignored or obsessively analyzed by Buster.</p>
                    </div>

                    <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, y: 10 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-lg ${msg.role === 'user'
                                            ? 'bg-sky-600 text-white rounded-br-none'
                                            : 'glass text-slate-100 rounded-bl-none border border-slate-700/50'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    <div className={`mt-1.5 text-[10px] ${msg.role === 'user' ? 'text-sky-200' : 'text-slate-500'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div className="glass flex items-center gap-2 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-700/50">
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]"></span>
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]"></span>
                            </div>
                        </motion.div>
                    )}

                    <div ref={scrollRef} className="h-4" />
                </div>
            </main>

            {/* Input Area */}
            <footer className="glass border-t border-slate-800/50 px-6 py-6 shadow-2xl">
                <div className="mx-auto max-w-4xl">
                    <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                        <input
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="w-full rounded-2xl bg-slate-900/50 border border-slate-700 py-4 pl-6 pr-16 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all font-medium"
                            placeholder={`Message ${pet?.name}...`}
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim() || isTyping}
                            className="absolute right-2.5 top-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500 text-white transition hover:bg-sky-400 disabled:opacity-0 disabled:scale-90"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                        <ShieldAlert size={10} />
                        Stay within character limits for the best experience
                    </div>
                </div>
            </footer>
        </div>
    );
}
