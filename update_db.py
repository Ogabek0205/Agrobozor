import re

file_path = r"c:\Users\ACER\Desktop\agrobozor\src\App.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace any base64 images with premium Unsplash images
text = re.sub(r'image:\s*"data:image\/[a-zA-Z0-9+\/;\=]+"(.*?)🍋', r'image: "https://images.unsplash.com/photo-1590502593747-422e0618037a?w=500&h=340&fit=crop"\1🍋', text)
text = re.sub(r'image:\s*"data:image\/[a-zA-Z0-9+\/;\=]+"(.*?)🌿', r'image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=340&fit=crop"\1🌿', text)

# Just to be extremely safe, catch any remaining data:image and replace with high quality produce pattern
text = re.sub(r'image:\s*"data:image\/[^"]+"', r'image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&h=340&fit=crop"', text)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("SUCCESS")
