def test_register_and_login(client):
    # Register
    res = client.post("/api/auth/register", json={
        "email": "unique_user@example.com",
        "password": "SecretPassword123!",
        "full_name": "Unique Test User"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "unique_user@example.com"

    # Duplicate registration should fail
    dup_res = client.post("/api/auth/register", json={
        "email": "unique_user@example.com",
        "password": "SecretPassword123!",
        "full_name": "Duplicate"
    })
    assert dup_res.status_code == 400

    # Login
    login_res = client.post("/api/auth/login", json={
        "email": "unique_user@example.com",
        "password": "SecretPassword123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Login wrong password
    bad_login = client.post("/api/auth/login", json={
        "email": "unique_user@example.com",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

def test_get_me(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "tester@example.com"

    # Without token
    no_auth_res = client.get("/api/auth/me")
    assert no_auth_res.status_code == 401

