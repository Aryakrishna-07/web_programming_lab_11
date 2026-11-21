const express = require("express");
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
const db = new DatabaseSync(path.join(__dirname, "users.db"));

// ---------- Database setup (table + pre-existing users) ----------
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
)`);
if (db.prepare("SELECT COUNT(*) AS c FROM users").get().c === 0) {
  const ins = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
  [["elia", "pretty123"], ["admin", "admin@123"], ["student", "lab2026"]]
    .forEach(([u, p]) => ins.run(u, bcrypt.hashSync(p, 10)));
}

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const page = (title, body) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title><link rel="stylesheet" href="/style.css"></head>
<body><main class="frame"><div class="strip"></div><div class="content">${body}</div>
<div class="strip pink"></div></main></body></html>`;

// ---------- Login validation ----------
app.post("/login", (req, res) => {
  const username = (req.body.username || "").trim();
  const password = req.body.password || "";
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (user && bcrypt.compareSync(password, user.password)) {
    return res.send(page("Login Successful", `
      <div class="badge ok">&#9829;</div>
      <h1>Login Successful!</h1>
      <p>Welcome back, <strong>${esc(user.username)}</strong>. You are now signed in.</p>
      <a class="btn" href="/">Log out</a>`));
  }
  res.status(401).send(page("Login Failed", `
    <div class="badge bad">&#10006;</div>
    <h1>Login Failed</h1>
    <p>Invalid username or password. Please try again.</p>
    <a class="btn" href="/">Try again</a>`));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
