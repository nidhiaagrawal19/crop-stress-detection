"""Temporary in-memory storage.

Member 4 replaces these dicts with real database calls
(backend/database). Keep the function names so the routes don't change.
"""
import secrets

USERS: dict[str, dict] = {}      # phone -> {name, phone}
SESSIONS: dict[str, str] = {}    # token -> phone
FARMS: dict[str, dict] = {}      # phone -> farm details
HISTORY: dict[str, list] = {}    # phone -> [analysis results, newest first]


def create_session(name: str, phone: str) -> str:
    USERS[phone] = {"name": name, "phone": phone}
    token = secrets.token_urlsafe(24)
    SESSIONS[token] = phone
    return token


def add_history(phone: str, result: dict, limit: int = 20) -> None:
    items = HISTORY.setdefault(phone, [])
    items.insert(0, result)
    del items[limit:]
