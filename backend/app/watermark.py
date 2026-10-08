from pathlib import Path
import secrets
import string
from PIL import Image

ALPHABET = string.ascii_uppercase + string.digits

def generate_watermark(recipient_id: str) -> str:
    suffix = "".join(secrets.choice(ALPHABET) for _ in range(16))
    return f"ST-{recipient_id}-{suffix}"

def _bits(text: str):
    data = text.encode("utf-8")
    payload = len(data).to_bytes(2, "big") + data
    return [(byte >> shift) & 1 for byte in payload for shift in range(7, -1, -1)]

def _decode(bits):
    raw = bytearray()
    for i in range(0, len(bits), 8):
        chunk = bits[i:i+8]
        if len(chunk) < 8: break
        value = 0
        for bit in chunk: value = (value << 1) | bit
        raw.append(value)
    if len(raw) < 2: raise ValueError("watermark header is missing")
    length = int.from_bytes(raw[:2], "big")
    if length <= 0 or length > len(raw) - 2: raise ValueError("invalid watermark")
    return raw[2:2+length].decode("utf-8")

def embed_image_watermark(source: Path, destination: Path, watermark: str):
    image = Image.open(source).convert("RGB")
    pixels = list(image.getdata())
    bits = _bits(watermark)
    if len(bits) > len(pixels):
        raise ValueError("image is too small for watermark")
    output, i = [], 0
    for r, g, b in pixels:
        if i < len(bits):
            r = (r & 0xFE) | bits[i]
            i += 1
        output.append((r, g, b))
    image.putdata(output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination)

def extract_image_watermark(source: Path) -> str:
    pixels = list(Image.open(source).convert("RGB").getdata())
    if len(pixels) < 16: raise ValueError("image too small")
    length = 0
    for pixel in pixels[:16]:
        length = (length << 1) | (pixel[0] & 1)
    total = 16 + length * 8
    if length <= 0 or total > len(pixels): raise ValueError("no valid watermark")
    return _decode([(pixels[i][0] & 1) for i in range(total)])

def supported_image(path: Path) -> bool:
    return path.suffix.lower() in {".png", ".jpg", ".jpeg"}
