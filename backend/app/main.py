from pathlib import Path
from uuid import uuid4
import json
from fastapi import FastAPI, File, HTTPException, UploadFile
from .hashing import sha256_file
from .watermark import generate_watermark, embed_image_watermark, extract_image_watermark, supported_image

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
DOCUMENTS, WATERMARKED, MANIFESTS = DATA/"documents", DATA/"watermarked", DATA/"manifests"
for d in (DOCUMENTS, WATERMARKED, MANIFESTS): d.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="SecureTrace Offline Backend", version="1.0.0")

@app.get("/")
def root():
    return {"project":"SecureTrace","modules":[1,2],"mode":"offline","status":"ready"}

@app.post("/documents/watermark")
async def watermark_document(recipient_id: str, file: UploadFile = File(...)):
    if not file.filename: raise HTTPException(400, "filename is required")
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
    (MANIFESTS/f"{issue_id}.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest

@app.post("/documents/extract-watermark")
async def extract_watermark(file: UploadFile = File(...)):
    temp = DOCUMENTS / f"extract_{uuid4()}_{file.filename}"
    temp.write_bytes(await file.read())
    try:
        return {"watermark_id": extract_image_watermark(temp)}
    except Exception as e:
        raise HTTPException(400, f"watermark extraction failed: {e}")
    finally:
        temp.unlink(missing_ok=True)
