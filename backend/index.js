/**
 * backend/index.js
 *
 * Minimal Express backend implementing:
 * - POST /api/auth/signup
 * - POST /api/auth/login
 * - GET/POST/PUT/DELETE /api/events
 * - GET /api/swappable-slots
 * - POST /api/swap-request
 * - POST /api/swap-response/:id
 * - GET /api/swaps
 *
 * Uses a simple JSON file as DB: backend/db.json
 * (no lowdb required)
 */

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const SECRET = process.env.JWT_SECRET || "dev-secret";
const DB_PATH = path.join(__dirname, "db.json");
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Simple file-based DB helpers ---
async function ensureDb() {
  try {
    await fs.access(DB_PATH);
  } catch {
    const initial = { users: [], events: [], swaps: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

// --- Auth helpers ---
function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token provided" });
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid authorization header" });
  }
  const token = parts[1];
  try {
    const data = jwt.verify(token, SECRET);
    req.user = data;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// --- Routes ---

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "name, email and password are required" });

    const db = await readDb();
    if (db.users.find((u) => u.email === email)) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = { id: nanoid(), name, email, password: hashed, createdAt: Date.now() };
    db.users.push(user);
    await writeDb(db);

    const token = generateToken({ id: user.id, email: user.email });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const db = await readDb();
    const user = db.users.find((u) => u.email === email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({ id: user.id, email: user.email });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Events (user-scoped) ---
// Create event
app.post("/api/events", authMiddleware, async (req, res) => {
  try {
    const { title, startTime, endTime } = req.body;
    if (!title || !startTime || !endTime) return res.status(400).json({ message: "Missing fields" });

    const db = await readDb();
    const ev = {
      id: nanoid(),
      title,
      startTime,
      endTime,
      status: "BUSY", // BUSY | SWAPPABLE | SWAP_PENDING
      ownerId: req.user.id,
      createdAt: Date.now(),
    };
    db.events.push(ev);
    await writeDb(db);
    res.json(ev);
  } catch (err) {
    console.error("create event error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Read user's events
app.get("/api/events", authMiddleware, async (req, res) => {
  try {
    const db = await readDb();
    const mine = db.events.filter((e) => e.ownerId === req.user.id);
    res.json(mine);
  } catch (err) {
    console.error("get events error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update event (only owner)
app.put("/api/events/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, startTime, endTime, status } = req.body;
    const db = await readDb();
    const ev = db.events.find((e) => e.id === id && e.ownerId === req.user.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });

    if (title !== undefined) ev.title = title;
    if (startTime !== undefined) ev.startTime = startTime;
    if (endTime !== undefined) ev.endTime = endTime;
    if (status !== undefined) ev.status = status;

    ev.updatedAt = Date.now();
    await writeDb(db);
    res.json(ev);
  } catch (err) {
    console.error("update event error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete event
app.delete("/api/events/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const db = await readDb();
    const idx = db.events.findIndex((e) => e.id === id && e.ownerId === req.user.id);
    if (idx === -1) return res.status(404).json({ message: "Event not found" });
    db.events.splice(idx, 1);
    await writeDb(db);
    res.json({ ok: true });
  } catch (err) {
    console.error("delete event error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Swappable slots (not own) ---
app.get("/api/swappable-slots", authMiddleware, async (req, res) => {
  try {
    const db = await readDb();
    const slots = db.events.filter((e) => e.status === "SWAPPABLE" && e.ownerId !== req.user.id);
    res.json(slots);
  } catch (err) {
    console.error("swappable-slots error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Swap request ---
/**
 * POST /api/swap-request
 * body: { mySlotId, theirSlotId }
 */
app.post("/api/swap-request", authMiddleware, async (req, res) => {
  try {
    const { mySlotId, theirSlotId } = req.body;
    if (!mySlotId || !theirSlotId) return res.status(400).json({ message: "mySlotId and theirSlotId required" });

    const db = await readDb();
    const my = db.events.find((e) => e.id === mySlotId && e.ownerId === req.user.id);
    const their = db.events.find((e) => e.id === theirSlotId);

    if (!my) return res.status(404).json({ message: "My slot not found" });
    if (!their) return res.status(404).json({ message: "Their slot not found" });

    if (my.status !== "SWAPPABLE" || their.status !== "SWAPPABLE") {
      return res.status(400).json({ message: "Both slots must be SWAPPABLE" });
    }

    // Create swap request
    const swap = {
      id: nanoid(),
      mySlotId,
      theirSlotId,
      fromUserId: req.user.id, // owner of mySlot
      toUserId: their.ownerId,
      status: "PENDING", // PENDING | ACCEPTED | REJECTED
      createdAt: Date.now(),
    };
    db.swaps.push(swap);

    // Mark both slots as SWAP_PENDING to prevent parallel offers
    my.status = "SWAP_PENDING";
    their.status = "SWAP_PENDING";

    await writeDb(db);
    res.json(swap);
  } catch (err) {
    console.error("swap-request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Swap response ---
/**
 * POST /api/swap-response/:id
 * body: { accept: boolean }
 *
 * Only the "toUser" (owner of theirSlot) may respond.
 * If accepted: exchange owners, set both slots to BUSY, mark swap ACCEPTED.
 * If rejected: set both slots back to SWAPPABLE, mark swap REJECTED.
 */
app.post("/api/swap-response/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const { accept } = req.body;

    const db = await readDb();
    const swap = db.swaps.find((s) => s.id === id);
    if (!swap) return res.status(404).json({ message: "Swap request not found" });

    if (swap.toUserId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to respond to this swap" });
    }

    const my = db.events.find((e) => e.id === swap.mySlotId);
    const their = db.events.find((e) => e.id === swap.theirSlotId);

    if (!my || !their) {
      // unusual state: swap exists but slots missing
      return res.status(500).json({ message: "Related slots not found" });
    }

    if (accept) {
      // Exchange ownership
      const myOwner = my.ownerId;
      const theirOwner = their.ownerId;
      my.ownerId = theirOwner;
      their.ownerId = myOwner;
      my.status = "BUSY";
      their.status = "BUSY";
      swap.status = "ACCEPTED";
    } else {
      // Revert both slots to SWAPPABLE
      my.status = "SWAPPABLE";
      their.status = "SWAPPABLE";
      swap.status = "REJECTED";
    }

    swap.respondedAt = Date.now();
    await writeDb(db);
    res.json(swap);
  } catch (err) {
    console.error("swap-response error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- List swaps for current user (incoming/outgoing) ---
app.get("/api/swaps", authMiddleware, async (req, res) => {
  try {
    const db = await readDb();
    const uid = req.user.id;
    const incoming = db.swaps.filter((s) => s.toUserId === uid);
    const outgoing = db.swaps.filter((s) => s.fromUserId === uid);
    res.json({ incoming, outgoing });
  } catch (err) {
    console.error("list swaps error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Start server ---
(async () => {
  try {
    await ensureDb();
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
      console.log(`DB file: ${DB_PATH}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
