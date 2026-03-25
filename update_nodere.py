file_path = r"c:\Users\ACER\Desktop\agrobozor\src\App.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(len(lines)):
    if "data:image" in lines[i]:
        if "🍋" in lines[i]:
            lines[i] = '      image: "https://images.unsplash.com/photo-1590502593747-422e0618037a?w=800&q=80", emoji: "🍋", status: "active", createdAt: "2024-06-20" },\n'
        elif "🌿" in lines[i]:
            lines[i] = '      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80", emoji: "🌿", status: "active", createdAt: "2024-06-21" },\n'
        else:
            lines[i] = '      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80", emoji: "✅", status: "active", createdAt: "2024-06-22" },\n'

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("SUCCESSFULLY CLEANED BLOAT")
