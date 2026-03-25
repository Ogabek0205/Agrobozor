const fs = require('fs');
const filePath = 'c:/Users/ACER/Desktop/agrobozor/src/App.jsx';
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(/image:\s*"data:image\/[^"]+"/g, (match) => {
    if (match.includes('🍋')) return 'image: "https://images.unsplash.com/photo-1590502593747-422e0618037a?w=800&q=80"';
    if (match.includes('🌿')) return 'image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80"';
    return 'image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80"';
});

// Since the whole App.jsx is huge and unreadable with truncated base64, cleaning them up should fix file operations.
fs.writeFileSync(filePath, content, 'utf-8');
console.log('Cleaned up base64 images successfully');
