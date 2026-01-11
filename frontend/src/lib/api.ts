import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;

export interface Pet {
    id: string;
    name: string;
    pet_type: string;
    breed?: string;
    age?: number;
    personality_traits: string[];
    favorite_things: string[];
    quirks?: string;
    created_at: string;
}

export interface ChatMessage {
    role: 'user' | 'pet';
    content: string;
    timestamp: string;
}

export const petService = {
    listPets: (userId: string) => api.get<Pet[]>(`/pets?user_id=${userId}`),
    getPet: (petId: string) => api.get<Pet>(`/pets/${petId}`),
    createPet: (petData: any, userId: string) => api.post<Pet>(`/pets?user_id=${userId}`, petData),
    deletePet: (petId: string) => api.delete(`/pets/${petId}`),
};

export const chatService = {
    sendMessage: (petId: string, message: string) =>
        api.post('/chat', { pet_id: petId, message }),
    getHistory: (petId: string) =>
        api.get<{ messages: ChatMessage[] }>(`/chat/${petId}/history`),
    clearHistory: (petId: string) =>
        api.delete(`/chat/${petId}/history`),
};
