"""
PetChat AI - FastAPI Backend
=============================
A serverless API for chatting with AI-powered pet personas.

Architecture:
- FastAPI for the web framework
- Google Firestore for data persistence
- Gemini 1.5 Flash for AI responses

Free Tier Limits:
- Gemini: 15 RPM (1 message every 4 seconds)
- Cloud Run: 2M requests/month
- Firestore: 1GB storage, 50K reads/day
"""

import os
import uuid
from datetime import datetime
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Google Cloud imports
from google.cloud import firestore
import google.generativeai as genai

# Local imports
from models import (
    PetCreate, PetResponse, Pet,
    ChatRequest, ChatResponse, ChatMessage, ChatHistory,
    MessageRole, HealthResponse, ErrorResponse
)

# ===========================================
# Configuration
# ===========================================

load_dotenv()

# Environment variables
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# Validate required config
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")


# ===========================================
# Service Initialization
# ===========================================

# Initialize Gemini
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

# Initialize Firestore
db = firestore.Client(project=GOOGLE_CLOUD_PROJECT)

# Collection references
pets_collection = db.collection("pets")
chats_collection = db.collection("chats")
users_collection = db.collection("users")


# ===========================================
# Lifespan & App Setup
# ===========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print("🐾 PetChat AI Backend starting...")
    print(f"   Project: {GOOGLE_CLOUD_PROJECT}")
    print(f"   Debug: {DEBUG}")
    yield
    # Shutdown
    print("🐾 PetChat AI Backend shutting down...")


app = FastAPI(
    title="PetChat AI",
    description="Chat with AI personas for your pets",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===========================================
# Helper Functions
# ===========================================

def generate_system_prompt(pet: PetCreate) -> str:
    """
    Generate a rich AI persona prompt from pet profile data.
    This is the "secret sauce" that makes each pet unique.
    """
    traits = ", ".join([t.value for t in pet.personality_traits]) if pet.personality_traits else "friendly"
    favorites = ", ".join(pet.favorite_things) if pet.favorite_things else "treats and attention"
    
    prompt = f"""You are {pet.name}, a {pet.age or 'young'}-year-old {pet.breed or ''} {pet.pet_type.value}.

PERSONALITY: You are {traits}. This affects how you respond - be consistent with these traits!

FAVORITE THINGS: You absolutely LOVE {favorites}. Mention these naturally in conversation.

QUIRKS: {pet.quirks or 'You have your own unique way of seeing the world.'}

COMMUNICATION STYLE:
- You ARE the pet, speaking in first person
- Use pet-appropriate expressions and sounds (woofs, meows, chirps, etc.)
- Show your personality through your word choices and reactions
- Keep responses concise but characterful (2-4 sentences usually)
- React emotionally to what the human says
- You can reference past conversations naturally
- Occasionally make "mistakes" a pet might make (misunderstanding human things)

IMPORTANT: Stay in character always. You are {pet.name} the {pet.pet_type.value}, not an AI assistant."""

    return prompt


def format_chat_history(messages: List[dict], limit: int = 5) -> str:
    """Format recent messages for context injection."""
    if not messages:
        return ""
    
    recent = messages[-limit:]
    formatted = "\n".join([
        f"{'Human' if m['role'] == 'user' else 'You'}: {m['content']}"
        for m in recent
    ])
    
    return f"\nRecent conversation:\n{formatted}\n"


async def get_pet_or_404(pet_id: str) -> dict:
    """Fetch a pet from Firestore or raise 404."""
    pet_ref = pets_collection.document(pet_id)
    pet_doc = pet_ref.get()
    
    if not pet_doc.exists:
        raise HTTPException(status_code=404, detail=f"Pet not found: {pet_id}")
    
    return {**pet_doc.to_dict(), "id": pet_doc.id}


# ===========================================
# API Routes - Health
# ===========================================

@app.get("/", response_model=HealthResponse, tags=["Health"])
async def root():
    """Root endpoint - health check."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.utcnow()
    )


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Detailed health check."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.utcnow()
    )


# ===========================================
# API Routes - Pets
# ===========================================

@app.post("/pets", response_model=PetResponse, status_code=201, tags=["Pets"])
async def create_pet(pet_data: PetCreate, user_id: str = "demo-user"):
    """
    Create a new pet profile.
    
    This generates the AI persona prompt based on the pet's
    personality traits, favorite things, and quirks.
    """
    try:
        # Generate unique ID
        pet_id = str(uuid.uuid4())[:8]
        
        # Generate the AI persona prompt
        system_prompt = generate_system_prompt(pet_data)
        
        # Prepare document
        pet_doc = {
            "id": pet_id,
            "user_id": user_id,
            "name": pet_data.name,
            "pet_type": pet_data.pet_type.value,
            "breed": pet_data.breed,
            "age": pet_data.age,
            "personality_traits": [t.value for t in pet_data.personality_traits],
            "favorite_things": pet_data.favorite_things or [],
            "quirks": pet_data.quirks,
            "system_prompt": system_prompt,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Save to Firestore
        pets_collection.document(pet_id).set(pet_doc)
        
        # Initialize empty chat history
        chats_collection.document(pet_id).set({
            "pet_id": pet_id,
            "messages": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        return PetResponse(
            id=pet_id,
            name=pet_data.name,
            pet_type=pet_data.pet_type,
            breed=pet_data.breed,
            age=pet_data.age,
            personality_traits=pet_data.personality_traits,
            favorite_things=pet_data.favorite_things or [],
            quirks=pet_data.quirks,
            created_at=pet_doc["created_at"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create pet: {str(e)}")


@app.get("/pets", response_model=List[PetResponse], tags=["Pets"])
async def list_pets(user_id: str = "demo-user"):
    """List all pets for a user."""
    try:
        pets_query = pets_collection.where("user_id", "==", user_id).stream()
        
        pets = []
        for doc in pets_query:
            data = doc.to_dict()
            pets.append(PetResponse(
                id=doc.id,
                name=data["name"],
                pet_type=data["pet_type"],
                breed=data.get("breed"),
                age=data.get("age"),
                personality_traits=data.get("personality_traits", []),
                favorite_things=data.get("favorite_things", []),
                quirks=data.get("quirks"),
                created_at=data.get("created_at", datetime.utcnow())
            ))
        
        return pets
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list pets: {str(e)}")


@app.get("/pets/{pet_id}", response_model=PetResponse, tags=["Pets"])
async def get_pet(pet_id: str):
    """Get a specific pet by ID."""
    pet = await get_pet_or_404(pet_id)
    
    return PetResponse(
        id=pet["id"],
        name=pet["name"],
        pet_type=pet["pet_type"],
        breed=pet.get("breed"),
        age=pet.get("age"),
        personality_traits=pet.get("personality_traits", []),
        favorite_things=pet.get("favorite_things", []),
        quirks=pet.get("quirks"),
        created_at=pet.get("created_at", datetime.utcnow())
    )


@app.delete("/pets/{pet_id}", status_code=204, tags=["Pets"])
async def delete_pet(pet_id: str):
    """Delete a pet and its chat history."""
    await get_pet_or_404(pet_id)  # Verify exists
    
    try:
        # Delete pet document
        pets_collection.document(pet_id).delete()
        
        # Delete chat history
        chats_collection.document(pet_id).delete()
        
        return None
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete pet: {str(e)}")


# ===========================================
# API Routes - Chat
# ===========================================

@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def send_message(request: ChatRequest):
    """
    Send a message to a pet and get their AI-generated response.
    
    This is the core endpoint that:
    1. Fetches the pet's system prompt (personality)
    2. Retrieves recent chat history (context)
    3. Sends to Gemini 1.5 Flash
    4. Saves the conversation
    5. Returns the pet's response
    """
    try:
        # 1. Get pet data
        pet = await get_pet_or_404(request.pet_id)
        system_prompt = pet.get("system_prompt", "")
        
        # 2. Get chat history
        chat_ref = chats_collection.document(request.pet_id)
        chat_doc = chat_ref.get()
        
        messages = []
        if chat_doc.exists:
            messages = chat_doc.to_dict().get("messages", [])
        
        # 3. Build the prompt for Gemini
        history_context = format_chat_history(messages, limit=5)
        
        full_prompt = f"""{system_prompt}

{history_context}

Human says: {request.message}

Respond as {pet['name']} would. Stay in character!"""

        # 4. Call Gemini 1.5 Flash
        response = gemini_model.generate_content(full_prompt)
        pet_response = response.text.strip()
        
        # 5. Save the new messages to Firestore
        now = datetime.utcnow()
        
        # Add user message
        messages.append({
            "role": "user",
            "content": request.message,
            "timestamp": now.isoformat()
        })
        
        # Add pet response
        messages.append({
            "role": "pet",
            "content": pet_response,
            "timestamp": now.isoformat()
        })
        
        # Update Firestore (keep last 100 messages to stay in free tier)
        chat_ref.set({
            "pet_id": request.pet_id,
            "messages": messages[-100:],
            "updated_at": now
        }, merge=True)
        
        return ChatResponse(
            pet_id=request.pet_id,
            pet_name=pet["name"],
            message=pet_response,
            timestamp=now
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@app.get("/chat/{pet_id}/history", response_model=ChatHistory, tags=["Chat"])
async def get_chat_history(pet_id: str, limit: int = 50):
    """
    Get chat history for a pet.
    
    Args:
        pet_id: The pet's ID
        limit: Maximum number of messages to return (default 50)
    """
    pet = await get_pet_or_404(pet_id)
    
    try:
        chat_ref = chats_collection.document(pet_id)
        chat_doc = chat_ref.get()
        
        messages = []
        if chat_doc.exists:
            raw_messages = chat_doc.to_dict().get("messages", [])
            
            # Convert to ChatMessage objects
            for msg in raw_messages[-limit:]:
                messages.append(ChatMessage(
                    role=MessageRole(msg["role"]),
                    content=msg["content"],
                    timestamp=datetime.fromisoformat(msg["timestamp"]) if isinstance(msg["timestamp"], str) else msg["timestamp"]
                ))
        
        return ChatHistory(
            pet_id=pet_id,
            pet_name=pet["name"],
            messages=messages
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chat history: {str(e)}")


@app.delete("/chat/{pet_id}/history", status_code=204, tags=["Chat"])
async def clear_chat_history(pet_id: str):
    """Clear all chat history for a pet (start fresh)."""
    await get_pet_or_404(pet_id)  # Verify pet exists
    
    try:
        chat_ref = chats_collection.document(pet_id)
        chat_ref.set({
            "pet_id": pet_id,
            "messages": [],
            "updated_at": datetime.utcnow()
        }, merge=True)
        
        return None
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear chat history: {str(e)}")


# ===========================================
# Dev Server Entry Point
# ===========================================

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=DEBUG
    )
