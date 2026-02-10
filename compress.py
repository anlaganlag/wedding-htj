from PIL import Image
import os

SRC = r"D:\BaiduNetdiskDownload\胡唐锦 吴漾 定稿\select2"
DST = os.path.join(SRC, "dist")
os.makedirs(DST, exist_ok=True)

photos = [
    "WIN_1631.jpg",
    "WIN_2141.jpg",
    "WIN_2622.jpg",
    "WIN_2696.jpg",
    "WIN_2731.jpg",
    "WIN_2849.jpg",
]

MAX_WIDTH = 1200
QUALITY = 80

for fname in photos:
    src_path = os.path.join(SRC, fname)
    dst_path = os.path.join(DST, fname)
    img = Image.open(src_path)
    img = img.convert("RGB")
    w, h = img.size
    if w > MAX_WIDTH:
        ratio = MAX_WIDTH / w
        new_size = (MAX_WIDTH, int(h * ratio))
        img = img.resize(new_size, Image.LANCZOS)
    img.save(dst_path, "JPEG", quality=QUALITY, optimize=True)
    size_kb = os.path.getsize(dst_path) / 1024
    print(f"{fname}: {w}x{h} -> {img.size[0]}x{img.size[1]}, {size_kb:.0f} KB")

# Generate share thumbnail from WIN_1631
thumb_path = os.path.join(DST, "share_thumb.jpg")
img = Image.open(os.path.join(SRC, "WIN_1631.jpg")).convert("RGB")
w, h = img.size
crop_size = min(w, h)
left = (w - crop_size) // 2
top = (h - crop_size) // 2
img = img.crop((left, top, left + crop_size, top + crop_size))
img = img.resize((300, 300), Image.LANCZOS)
img.save(thumb_path, "JPEG", quality=85, optimize=True)
print(f"share_thumb.jpg: 300x300, {os.path.getsize(thumb_path)/1024:.0f} KB")

print("\nDone!")
