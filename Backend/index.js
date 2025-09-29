import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

// get league match data
import matchRouter from "./routes/matches.js";
import statsRouter from "./routes/stats.js";
import groupRouter from "./routes/groups.js";

dotenv.config();
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Connect to Postgres
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// API routes
app.use("/api/matches", matchRouter);
app.use("/api", statsRouter);
app.use("/api/groups", groupRouter);

// Signup route
app.post("/signup", async (req, res) => {
  const { username, password, tag_line } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (username, password_hash, tag_line) VALUES ($1, $2, $3) RETURNING id, username",
      [username, hashed, tag_line]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Username already exists" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [
      username,
    ]);

    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    // Create a token (to keep user logged in)
    const token = jwt.sign({ id: user.id, username: user.username }, "SECRET", {
      expiresIn: "1h",
    });

    res.json({ token, username: user.username});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
