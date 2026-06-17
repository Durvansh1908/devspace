import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../database";

const router = Router();

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const id = Date.now().toString();

    db.prepare("INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)").run(id, name, email, hashed);

    const token = jwt.sign(
      { id, email, name },
      process.env.JWT_SECRET || "devspace_secret",
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id, name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || "devspace_secret",
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "devspace_secret") as any;
    const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(decoded.id);
    res.json({ user });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;