'use client';

import React, { useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { PawPrint, LogIn, Mail, Lock, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass w-full max-w-md rounded-2xl p-8 shadow-2xl"
            >
                <div className="mb-8 flex flex-col items-center">
                    <div className="bg-sky-500/20 mb-4 rounded-full p-4 p-4 text-sky-400 animate-float">
                        <PawPrint size={48} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">PetChat AI</h1>
                    <p className="text-slate-400 mt-2 text-center">
                        {isLogin ? 'Welcome back! Your pets are waiting.' : 'Create an account to start chatting.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-slate-300 text-sm font-medium">Email</label>
                        <div className="relative">
                            <Mail className="text-slate-500 absolute left-3 top-3" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl bg-slate-900/50 border border-slate-700 py-2.5 pl-10 pr-4 text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-slate-300 text-sm font-medium">Password</label>
                        <div className="relative">
                            <Lock className="text-slate-500 absolute left-3 top-3" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl bg-slate-900/50 border border-slate-700 py-2.5 pl-10 pr-4 text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <LogIn size={20} />
                                {isLogin ? 'Sign In' : 'Create Account'}
                            </>
                        )}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-transparent px-2 text-slate-500">Or continue with</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 py-3 font-medium text-white transition hover:bg-slate-800"
                >
                    <Chrome size={20} />
                    Google
                </button>

                <p className="text-slate-400 mt-8 text-center text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="font-semibold text-sky-400 hover:underline"
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </motion.div>
        </div>
    );
}
