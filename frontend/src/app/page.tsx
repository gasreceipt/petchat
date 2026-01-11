'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { petService, Pet } from '@/lib/api';
import { Plus, LogOut, PawPrint, MessageCircle, Info, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPets();
    }
  }, [user]);

  const fetchPets = async () => {
    try {
      const response = await petService.listPets(user?.uid || 'demo-user');
      setPets(response.data);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePet = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this pet?')) return;

    try {
      await petService.deletePet(id);
      setPets(pets.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete pet:', error);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Your Pets</h1>
          <p className="text-slate-400 mt-2">Welcome back, {user?.email?.split('@')[0]}</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/create"
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-400 shadow-lg shadow-sky-500/20"
          >
            <Plus size={20} />
            Add Pet
          </Link>
          <button
            onClick={logout}
            className="glass flex items-center justify-center rounded-xl p-3 text-white transition hover:bg-red-500/20 hover:text-red-400"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
        </div>
      ) : pets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass flex flex-col items-center justify-center rounded-3xl p-16 text-center"
        >
          <div className="bg-slate-800/50 mb-6 rounded-full p-6 text-slate-500">
            <PawPrint size={64} />
          </div>
          <h2 className="text-2xl font-semibold text-white">No pets yet</h2>
          <p className="text-slate-400 mt-2 max-w-md">
            Create your first pet profile to start chatting with their AI persona.
          </p>
          <Link
            href="/create"
            className="mt-8 rounded-xl bg-sky-500 px-8 py-3 font-semibold text-white transition hover:bg-sky-400"
          >
            Get Started
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              key={pet.id}
            >
              <Link href={`/chat/${pet.id}`} className="group relative block h-full">
                <div className="glass glass-hover h-full rounded-3xl p-8 transition-all">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="bg-sky-500/20 flex h-16 w-16 items-center justify-center rounded-2xl text-sky-400">
                      <PawPrint size={32} />
                    </div>
                    <button
                      onClick={(e) => handleDeletePet(e, pet.id)}
                      className="text-slate-500 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <h3 className="text-2xl font-bold text-white">{pet.name}</h3>
                  <div className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
                    <span className="capitalize">{pet.pet_type}</span>
                    <span>•</span>
                    <span>{pet.breed || 'Unknown Breed'}</span>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {pet.personality_traits.map((trait) => (
                      <span key={trait} className="bg-slate-800/50 rounded-full px-3 py-1 text-xs font-medium text-slate-300">
                        {trait}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 text-sky-400">
                      <MessageCircle size={18} />
                      <span className="text-sm font-medium">Chat Now</span>
                    </div>
                    <Info size={18} className="text-slate-500" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
