"""
Test suite for the High School Activities API.
Tests cover activity listing, participant signup, and unregistration.
"""
import pytest
from fastapi import status

def test_root_endpoint(client):
    """Test that the root path serves the index.html file."""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    assert "text/html" in response.headers["content-type"].lower()

def test_get_activities(client):
    """Test getting the list of activities."""
    response = client.get("/activities")
    assert response.status_code == status.HTTP_200_OK
    activities = response.json()
    
    # Verify basic structure and some required activities
    assert isinstance(activities, dict)
    assert "Chess Club" in activities
    assert "Programming Class" in activities
    
    # Verify activity structure
    chess_club = activities["Chess Club"]
    assert "description" in chess_club
    assert "schedule" in chess_club
    assert "max_participants" in chess_club
    assert "participants" in chess_club
    assert isinstance(chess_club["participants"], list)

def test_signup_flow(client, test_activity, test_email):
    """Test the complete signup flow for an activity."""
    # Get initial participants
    response = client.get("/activities")
    initial_participants = response.json()[test_activity]["participants"]
    
    # Sign up new participant
    response = client.post(
        f"/activities/{test_activity}/signup",
        params={"email": test_email}
    )
    assert response.status_code == status.HTTP_200_OK
    assert "message" in response.json()
    
    # Verify participant was added
    response = client.get("/activities")
    updated_participants = response.json()[test_activity]["participants"]
    assert len(updated_participants) == len(initial_participants) + 1
    assert test_email in updated_participants

def test_duplicate_signup(client, test_activity, test_email):
    """Test that signing up the same participant twice fails."""
    # First, ensure participant is not already registered
    unregister_resp = client.post(
        f"/activities/{test_activity}/unregister",
        params={"participant": test_email}
    )
    
    # First signup should succeed
    response = client.post(
        f"/activities/{test_activity}/signup",
        params={"email": test_email}
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Second signup should fail
    response = client.post(
        f"/activities/{test_activity}/signup",
        params={"email": test_email}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    error = response.json()
    assert "detail" in error
    assert "already signed up" in error["detail"].lower()

def test_unregister_flow(client, test_activity, test_email):
    """Test the complete unregister flow for an activity."""
    # First sign up a participant
    client.post(
        f"/activities/{test_activity}/signup",
        params={"email": test_email}
    )
    
    # Then unregister them
    response = client.post(
        f"/activities/{test_activity}/unregister",
        params={"participant": test_email}
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Verify participant was removed
    response = client.get("/activities")
    current_participants = response.json()[test_activity]["participants"]
    assert test_email not in current_participants

def test_unregister_nonexistent(client, test_activity):
    """Test unregistering a participant that doesn't exist."""
    response = client.post(
        f"/activities/{test_activity}/unregister",
        params={"participant": "nonexistent@example.com"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "detail" in response.json()

def test_invalid_activity(client):
    """Test operations with an invalid activity name."""
    activity = "NonexistentActivity"
    
    # Try to sign up
    response = client.post(
        f"/activities/{activity}/signup",
        params={"email": "test@example.com"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    
    # Try to unregister
    response = client.post(
        f"/activities/{activity}/unregister",
        params={"participant": "test@example.com"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND