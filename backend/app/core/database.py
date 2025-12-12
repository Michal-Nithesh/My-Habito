"""
Database connection and utilities
"""
from supabase import create_client, Client
from app.core.config import settings
from typing import Optional

class SupabaseClient:
    """Supabase client wrapper"""
    
    _client: Optional[Client] = None
    
    @classmethod
    def get_client(cls, token: Optional[str] = None) -> Client:
        """Get or create Supabase client with optional authentication token"""
        if token:
            # Create authenticated client with user's JWT token
            client = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_KEY,
            )
            # Set the user's JWT token for authenticated requests
            client.postgrest.auth(token)
            return client
        
        if cls._client is None:
            # Create client with minimal options to avoid proxy parameter issue
            cls._client = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_KEY,
            )
        return cls._client
    
    @classmethod
    def get_db(cls):
        """Get database client"""
        return cls.get_client()

# Dependency for route handlers
def get_supabase(token: Optional[str] = None) -> Client:
    """FastAPI dependency to get Supabase client"""
    return SupabaseClient.get_client(token)
