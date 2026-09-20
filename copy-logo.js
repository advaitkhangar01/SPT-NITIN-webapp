const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "logo.png");
const destDir = path.join(__dirname, "public");
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}
fs.copyFileSync(src, path.join(destDir, "logo.png"));
console.log("Logo successfully copied to public/logo.png");
