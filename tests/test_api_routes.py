from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_api_health_and_dashboard():
    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    dashboard = client.get("/api/dashboard")
    assert dashboard.status_code == 200
    assert "stats" in dashboard.json()
    assert "nodes" in dashboard.json()
    assert "activities" in dashboard.json()


def test_api_documents_and_verify_endpoints():
    documents = client.get("/api/documents")
    assert documents.status_code == 200
    assert isinstance(documents.json(), list)

    blockchain = client.get("/api/blockchain")
    assert blockchain.status_code == 200
    assert "blocks" in blockchain.json()

    network = client.get("/api/network")
    assert network.status_code == 200
    assert isinstance(network.json(), list)
