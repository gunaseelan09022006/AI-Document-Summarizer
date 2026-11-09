import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, get_db
from app.main import app

# In-memory test SQLite database with StaticPool so all threads share the memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(autouse=True)
def init_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app, raise_server_exceptions=True)
    yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(client):
    """Register a test user and return auth bearer header."""
    user_payload = {
        "email": "tester@example.com",
        "password": "Password123!",
        "full_name": "Test User"
    }
    res = client.post("/api/auth/register", json=user_payload)
    if res.status_code == 201:
        token = res.json()["access_token"]
    else:
        login_res = client.post("/api/auth/login", json={"email": user_payload["email"], "password": user_payload["password"]})
        token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
