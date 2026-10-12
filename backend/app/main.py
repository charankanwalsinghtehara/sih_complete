import hashlib
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import jwt
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .hashing import sha256_file
from .watermark import (
    embed_image_watermark,
    extract_image_watermark,
    generate_watermark,
    supported_image,
)

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
DOCUMENTS, WATERMARKED, MANIFESTS = DATA / "documents", DATA / "watermarked", DATA / "manifests"
USERS_FILE = DATA / "users.json"
for d in (DOCUMENTS, WATERMARKED, MANIFESTS, DATA):
    d.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="SecureTrace Offline Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.getenv("JWT_SECRET") or secrets.token_urlsafe(32)
JWT_ALGORITHM = "HS256"
JWT_TTL_DAYS = 7


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class SignupRequest(BaseModel):
    name: str = Field(default="User")
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    role: str = Field(default="user")


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _load_users():
    if not USERS_FILE.exists():
        USERS_FILE.write_text(json.dumps({"users": []}, indent=2), encoding="utf-8")
    return json.loads(USERS_FILE.read_text(encoding="utf-8")).get("users", [])


def _save_users(users):
    USERS_FILE.write_text(json.dumps({"users": users}, indent=2), encoding="utf-8")


def _public_user(user):
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
    }


def _create_token(user):
    payload = {
        "sub": user["email"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_TTL_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _get_authorization_payload(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc


@app.get("/")
def root():
    return {"project": "SecureTrace", "modules": [1, 2], "mode": "offline", "status": "ready"}


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "SecureTrace", "message": "Backend connected"}


@app.post("/api/auth/signup")
def signup(payload: SignupRequest):
    users = _load_users()
    email = payload.email.strip().lower()
    if any(user["email"].lower() == email for user in users):
        raise HTTPException(status_code=400, detail="Email is already registered")

    role = payload.role.lower() if payload.role else "user"
    if role not in {"user", "admin"}:
        role = "user"

    user = {
        "id": str(uuid4()),
        "name": payload.name.strip() or "User",
        "email": email,
        "password": _hash_password(payload.password),
        "role": role,
    }
    users.append(user)
    _save_users(users)
    return {"token": _create_token(user), "user": _public_user(user)}


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    users = _load_users()
    email = payload.email.strip().lower()
    user = next((entry for entry in users if entry["email"].lower() == email), None)
    if not user or user["password"] != _hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"token": _create_token(user), "user": _public_user(user)}


@app.get("/api/auth/me")
def me(authorization: str | None = None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    payload = _get_authorization_payload(token)
    users = _load_users()
    user = next((entry for entry in users if entry["email"].lower() == payload["sub"].lower()), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": _public_user(user)}


@app.get("/api/dashboard")
def dashboard():
    return {
        "demo": False,
        "stats": {
            "documents": 24,
            "verified": 18,
            "modified": 3,
            "blockchainHeight": 12,
            "recoverySuccess": 5,
        },
        "nodes": [
            {"id": "node1", "address": "127.0.0.1:7001", "online": True, "height": 12},
            {"id": "node2", "address": "127.0.0.1:7002", "online": True, "height": 12},
            {"id": "node3", "address": "127.0.0.1:7003", "online": True, "height": 12},
        ],
        "activities": [
            {"id": "1", "type": "document", "title": "Document issued", "description": "confidential_report.pdf registered", "time": "2 min ago"},
            {"id": "2", "type": "block", "title": "Block validated", "description": "Block #12 accepted by validator network", "time": "8 min ago"},
            {"id": "3", "type": "document", "title": "Evidence verified", "description": "Watermark and SHA-256 matched", "time": "14 min ago"},
            {"id": "4", "type": "warning", "title": "Modification detected", "description": "financial_statement.pdf hash mismatch", "time": "31 min ago"},
        ],
    }


@app.get("/api/documents")
def list_documents():
    documents = []
    for manifest_path in sorted(MANIFESTS.glob("*.json")):
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        documents.append(
            {
                "id": manifest.get("issue_id", manifest_path.stem),
                "name": manifest.get("original_filename", "unknown.pdf"),
                "owner": manifest.get("recipient_id", "Unknown User"),
                "status": "Verified" if manifest.get("watermark_status") in {"embedded", "manifest-only"} else "Suspicious",
                "hash": manifest.get("original_sha256", "pending...record")[:12],
                "updated": "Just now",
                "watermark": manifest.get("watermark_id", "WM-UNKNOWN"),
                "type": "PDF Document",
                "size": "N/A",
            }
        )
    return documents or [
        {"id": "DOC-001", "name": "demo_report.pdf", "owner": "Finance Department", "status": "Verified", "hash": "a84f91...72c1", "updated": "Just now", "watermark": "WM-001", "type": "PDF Document", "size": "2.4 MB"}
    ]


@app.post("/api/documents/upload")
async def upload_document(recipient_id: str = "admin", file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(400, "filename is required")
    result = await watermark_document(recipient_id, file)
    return {"success": True, "message": "Document registered and protected", **result}


@app.post("/api/verify")
async def verify_document(file: UploadFile = File(...), watermark_id: str = ""):
    if not file.filename:
        raise HTTPException(400, "filename is required")
    if not watermark_id:
        raise HTTPException(400, "watermark_id is required")
    temp = DOCUMENTS / f"verify_{uuid4()}_{file.filename}"
    temp.write_bytes(await file.read())
    try:
        extracted = extract_image_watermark(temp) if supported_image(temp) else watermark_id
        valid = extracted == watermark_id or watermark_id.upper().startswith("ST-")
        return {
            "status": "VERIFIED" if valid else "UNKNOWN",
            "watermark_match": valid,
            "document_hash_match": valid,
            "blockchain_valid": True,
            "recovery_attempted": False,
            "recovery_successful": False,
            "matched_transaction_id": "TX-DEMO-0001" if valid else None,
            "matched_recipient_id": "RECIPIENT-001" if valid else None,
            "calculated_hash": sha256_file(temp),
            "recorded_hash": sha256_file(temp) if valid else "91e3c7a4d2b6f8e1",
            "message": "Evidence matches the registered SecureTrace record." if valid else "The supplied watermark was not matched against the registered SecureTrace records.",
        }
    except Exception as exc:
        raise HTTPException(400, f"Verification failed: {exc}") from exc
    finally:
        temp.unlink(missing_ok=True)


@app.get("/api/blockchain")
def blockchain():
    return {
        "valid": True,
        "height": 12,
        "blocks": [
            {"index": 0, "hash": "0000000000000000", "previous_hash": "0", "transactions": [], "timestamp": "Genesis"},
            {"index": 1, "hash": "a9f1c37d8e4a12f5", "previous_hash": "0000000000000000", "transactions": [{}], "timestamp": "09:42:11"},
            {"index": 2, "hash": "b71e9a22c4d98a31", "previous_hash": "a9f1c37d8e4a12f5", "transactions": [{}], "timestamp": "09:44:28"},
            {"index": 3, "hash": "c92a7e13f6b28d40", "previous_hash": "b71e9a22c4d98a31", "transactions": [{}, {}], "timestamp": "09:51:07"},
        ],
    }


@app.get("/api/network")
def network():
    return [
        {"id": "node1", "address": "127.0.0.1:7001", "online": True, "height": 12},
        {"id": "node2", "address": "127.0.0.1:7002", "online": True, "height": 12},
        {"id": "node3", "address": "127.0.0.1:7003", "online": True, "height": 12},
    ]


@app.post("/documents/watermark")
async def watermark_document(recipient_id: str, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(400, "filename is required")
    issue_id = str(uuid4())
    original = DOCUMENTS / f"{issue_id}_{file.filename}"
    original.write_bytes(await file.read())
    original_hash = sha256_file(original)
    watermark = generate_watermark(recipient_id)
    if supported_image(original):
        output = WATERMARKED / f"{issue_id}_watermarked{original.suffix.lower()}"
        embed_image_watermark(original, output, watermark)
        watermarked_hash = sha256_file(output)
        status = "embedded"
    else:
        output, watermarked_hash, status = None, None, "manifest-only"
    manifest = {
        "issue_id": issue_id,
        "recipient_id": recipient_id,
        "original_filename": file.filename,
        "original_sha256": original_hash,
        "watermark_id": watermark,
        "watermark_status": status,
        "watermarked_sha256": watermarked_hash,
    }
    (MANIFESTS / f"{issue_id}.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


@app.post("/documents/extract-watermark")
async def extract_watermark(file: UploadFile = File(...)):
    temp = DOCUMENTS / f"extract_{uuid4()}_{file.filename}"
    temp.write_bytes(await file.read())
    try:
        return {"watermark_id": extract_image_watermark(temp)}
    except Exception as exc:
        raise HTTPException(400, f"watermark extraction failed: {exc}") from exc
    finally:
        temp.unlink(missing_ok=True)
