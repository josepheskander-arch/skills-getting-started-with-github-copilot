import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)

@pytest.fixture
def test_activity():
    """Return a test activity name that exists in the app."""
    return "Chess Club"

@pytest.fixture
def test_email():
    """Return a test email for participant operations."""
    return "test.participant@mergington.edu"

@pytest.fixture(autouse=True)
def reset_activities():
    """Reset activities data after each test."""
    # Store original state
    original = activities.copy()
    # Let test run
    yield
    # Restore original state
    activities.clear()
    activities.update(original)