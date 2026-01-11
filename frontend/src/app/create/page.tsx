'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { petService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Wand2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const PET_TYPES = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'];
const TRAITS = ['playful', 'grumpy', 'lazy', 'energetic', 'curious', 'shy', 'mischievous', 'affectionate', 'sassy', 'dramatic'];

export default function CreatePet() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        pet_type: 'dog',
        breed: '',
        age: 0,
        personality_traits: [] as string[],
        favorite_things: [] as string[],
        quirks: ''
    });

    const [currentFav, setCurrentFav] = useState('');

    const toggleTrait = (trait: string) => {
        if (formData.personality_traits.includes(trait)) {
            setFormData({
                ...formData,
                personality_traits: formData.personality_traits.filter(t => t !== trait)
            });
        } else if (formData.personality_traits.length < 5) {
            setFormData({
                ...formData,
                personality_traits: [...formData.personality_traits, trait]
            });
        }
    };

    const addFavorite = () => {
        if (currentFav && !formData.favorite_things.includes(currentFav)) {
            setFormData({
                ...formData,
                favorite_things: [...formData.favorite_things, currentFav]
            });
            setCurrentFav('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await petService.createPet(formData, user?.uid || 'demo-user');
            router.push('/');
        } catch (error) {
            console.error('Failed to create pet:', error);
            alert('Failed to create pet. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-12">
            <Link href="/" className="text-slate-400 mb-8 flex items-center gap-2 transition hover:text-white">
                <ArrowLeft size={20} />
                Back to Dashboard
            </Link>

            <header className="mb-12">
                <h1 className="text-4xl font-bold text-white">Create a Pet Persona</h1>
                <p className="text-slate-400 mt-2">The more details you provide, the better their AI personality will be.</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="glass rounded-3xl p-8">
                    <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
                        <span className="bg-sky-500/20 flex h-8 w-8 items-center justify-center rounded-lg text-sm text-sky-400">1</span>
                        Basic Information
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-slate-300 text-sm font-medium">Pet's Name</label>
                            <input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-xl bg-slate-900/50 border border-slate-700 py-2.5 px-4 text-white focus:border-sky-500 focus:outline-none"
                                placeholder="e.g. Buster"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-slate-300 text-sm font-medium">Pet Type</label>
                            <select
                                value={formData.pet_type}
                                onChange={(e) => setFormData({ ...formData, pet_type: e.target.value })}
                                className="w-full rounded-xl bg-slate-900/50 border border-slate-700 py-2.5 px-4 text-white focus:border-sky-500 focus:outline-none capitalize"
                            >
                                {PET_TYPES.map(type => (
                                    <option key={type} value={type} className="bg-slate-900">{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-slate-300 text-sm font-medium">Breed (Optional)</label>
                            <input
                                value={formData.breed}
                                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                className="w-full rounded-xl bg-slate-900/50 border border-slate-700 py-2.5 px-4 text-white focus:border-sky-500 focus:outline-none"
                                placeholder="e.g. Golden Retriever"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-slate-300 text-sm font-medium">Age</label>
                            <input
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                                className="w-full rounded-xl bg-slate-900/50 border border-slate-700 py-2.5 px-4 text-white focus:border-sky-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Personality Traits */}
                <div className="glass rounded-3xl p-8">
                    <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
                        <span className="bg-sky-500/20 flex h-8 w-8 items-center justify-center rounded-lg text-sm text-sky-400">2</span>
                        Personality Traits
                    </h2>
                    <p className="text-slate-400 mb-6 text-sm">Select up to 5 traits that describe your pet's personality.</p>
                    <div className="flex flex-wrap gap-3">
                        {TRAITS.map(trait => (
                            <button
                                key={trait}
                                type="button"
                                onClick={() => toggleTrait(trait)}
                                className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${formData.personality_traits.includes(trait)
                                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                {trait}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Favorites & Quirks */}
                <div className="glass rounded-3xl p-8">
                    <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
                        <span className="bg-sky-500/20 flex h-8 w-8 items-center justify-center rounded-lg text-sm text-sky-400">3</span>
                        Favorites & Quirks
                    </h2>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-slate-300 text-sm font-medium">Favorite Things</label>
                            <div className="flex gap-2">
                                <input
                                    value={currentFav}
                                    onChange={(e) => setCurrentFav(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFavorite())}
                                    className="flex-1 rounded-xl bg-slate-900/50 border border-slate-700 py-2.5 px-4 text-white focus:border-sky-500 focus:outline-none"
                                    placeholder="e.g. Cheese, Tennis balls, Naps"
                                />
                                <button
                                    type="button"
                                    onClick={addFavorite}
                                    className="rounded-xl bg-slate-800 px-6 font-medium text-white transition hover:bg-slate-700"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {formData.favorite_things.map(fav => (
                                    <span key={fav} className="bg-sky-500/10 rounded-full px-4 py-1.5 text-xs font-medium text-sky-400 border border-sky-500/20">
                                        {fav}
                                        <button
                                            onClick={() => setFormData({ ...formData, favorite_things: formData.favorite_things.filter(f => f !== fav) })}
                                            className="ml-2 hover:text-white"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-300 text-sm font-medium">Quirks (Optional)</label>
                            <textarea
                                rows={3}
                                value={formData.quirks}
                                onChange={(e) => setFormData({ ...formData, quirks: e.target.value })}
                                className="w-full rounded-xl bg-slate-900/50 border border-slate-700 py-2.5 px-4 text-white focus:border-sky-500 focus:outline-none"
                                placeholder="What makes them unique? e.g. 'He spins three times before lying down' or 'She's afraid of cucumbers'"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-4 text-lg font-bold text-white transition hover:bg-sky-400 shadow-xl shadow-sky-500/20 disabled:opacity-50"
                >
                    {loading ? (
                        'Creating Persona...'
                    ) : (
                        <>
                            <Sparkles size={24} />
                            Bring them to Life
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
