const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const key = crypto.createHash("sha256")
  .update(String(process.env.JWT_SECRET))
  .digest("base64")
  .substr(0, 32);

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = parts.join(":");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/* Caesar Encrypt */
function encryptCaesar(text) {
  const shift = 3;

  return text.split("").map(char => {
    return String.fromCharCode(char.charCodeAt(0) + shift);
  }).join("");
}

/* Caesar Decrypt */
function decryptCaesar(text) {
  const shift = 3;

  return text.split("").map(char => {
    return String.fromCharCode(char.charCodeAt(0) - shift);
  }).join("");
}

module.exports = {
  encrypt,
  decrypt,
  encryptCaesar,
  decryptCaesar
};
