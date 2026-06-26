const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join('\n');
const cleaned = scripts.replace(/<\?!=.*?\?>/g, 'PLACEHOLDER');
fs.writeFileSync('test_index.js', cleaned);
