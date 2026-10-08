from pathlib import Path
from PIL import Image
from backend.app.watermark import generate_watermark, embed_image_watermark, extract_image_watermark

def test_watermark_round_trip(tmp_path: Path):
    source = tmp_path / "source.png"
    output = tmp_path / "watermarked.png"
    Image.new("RGB", (100, 100), (120,120,120)).save(source)
    wm = generate_watermark("recipient-01")
    embed_image_watermark(source, output, wm)
    assert extract_image_watermark(output) == wm
