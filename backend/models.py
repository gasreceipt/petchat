"""
PetChat AI - Pydantic Models
============================
Data models for request/response validation and type safety.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ===========================================
# Enums
# ===========================================

class PetType(str, Enum):
    """Supported pet types for personality generation."""
    DOG = "dog"
    CAT = "cat"
    BIRD = "bird"
    RABBIT = "rabbit"
    HAMSTER = "hamster"
    FISH = "fish"
    REPTILE = "reptile"
    OTHER = "other"


class PersonalityTrait(str, Enum):
    """Pre-defined personality traits for pets."""
    PLAYFUL = "playful"
    GRUMPY = "grumpy"
    LAZY = "lazy"
    ENERGETIC = "energetic"
    CURIOUS = "curious"
    SHY = "shy"
    MISCHIEVOUS = "mischievous"
    AFFECTIONATE = "affectionate"
    SASSY = "sassy"
    DRAMATIC = "dramatic"


# ===========================================
# Pet Models
# ===========================================

class PetCreate(BaseModel):
    """Model for creating a new pet profile."""
    name: str = Field(..., min_length=1, max_length=50, description="Pet's name")
    pet_type: PetType = Field(..., description="Type of pet")
    breed: Optional[str] = Field(None, max_length=50, description="Pet's breed")
    age: Optional[int] = Field(None, ge=0, le=100, description="Pet's age in years")
    personality_traits: List[PersonalityTrait] = Field(
        default_factory=list,
        max_length=5,
        description="Up to 5 personality traits"
    )
    favorite_things: Optional[List[str]] = Field(
        default_factory=list,
        max_length=10,
        description="Things the pet loves (e.g., 'cheese', 'naps', 'zoomies')"
    )
    quirks: Optional[str] = Field(
        None,
        max_length=500,
        description="Any special quirks or behaviors"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Buster",
                "pet_type": "dog",
                "breed": "Golden Retriever",
                "age": 3,
                "personality_traits": ["playful", "energetic", "affectionate"],
                "favorite_things": ["cheese", "belly rubs", "the mailman (enemy)"],
                "quirks": "Spins in circles three times before lying down. Afraid of the vacuum."
            }
        }


class Pet(PetCreate):
    """Full pet model including database fields."""
    id: str = Field(..., description="Unique pet identifier")
    user_id: str = Field(..., description="Owner's user ID")
    system_prompt: str = Field(..., description="Generated AI persona prompt")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PetResponse(BaseModel):
    """API response for pet data."""
    id: str
    name: str
    pet_type: PetType
    breed: Optional[str]
    age: Optional[int]
    personality_traits: List[PersonalityTrait]
    favorite_things: List[str]
    quirks: Optional[str]
    created_at: datetime


# ===========================================
# Chat Models
# ===========================================

class MessageRole(str, Enum):
    """Who sent the message."""
    USER = "user"
    PET = "pet"


class ChatMessage(BaseModel):
    """A single chat message."""
    role: MessageRole
    content: str = Field(..., min_length=1, max_length=2000)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    """Incoming chat request from the frontend."""
    pet_id: str = Field(..., description="ID of the pet to chat with")
    message: str = Field(..., min_length=1, max_length=2000, description="User's message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "pet_id": "abc123",
                "message": "Who's a good boy?"
            }
        }


class ChatResponse(BaseModel):
    """Response from the pet AI."""
    pet_id: str
    pet_name: str
    message: str = Field(..., description="The pet's response")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "pet_id": "abc123",
                "pet_name": "Buster",
                "message": "ME! I AM THE GOOD BOY! *tail wagging intensifies* Do you have cheese? I smell cheese. You definitely have cheese.",
                "timestamp": "2026-01-11T15:30:00Z"
            }
        }


class ChatHistory(BaseModel):
    """Full chat history for a pet."""
    pet_id: str
    pet_name: str
    messages: List[ChatMessage] = Field(default_factory=list)


# ===========================================
# User Models (Simple for MVP)
# ===========================================

class UserCreate(BaseModel):
    """Model for creating a new user."""
    display_name: str = Field(..., min_length=1, max_length=50)
    email: Optional[str] = Field(None, description="Optional email for account")


class User(UserCreate):
    """Full user model."""
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ===========================================
# API Response Wrappers
# ===========================================

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
