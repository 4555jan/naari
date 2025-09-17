const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());
app.use(cors());

// Firebase Admin Initialization
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Razorpay Initialization
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Routes

app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: "order_rcptid_11",
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("🔥 Razorpay error:", err.message);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.post("/api/cart/remove", async (req, res) => {
  try {
    const { userId, name } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const cartRef = db.collection("carts").doc(userId);
    const doc = await cartRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const items = doc.data().items || [];
    const updatedItems = items.filter((item) => item.name !== name);

    await cartRef.update({ items: updatedItems });

    res.json({ message: "Item removed from cart", items: updatedItems });
    console.log(`🗑️ Removed ${name} from ${userId}'s cart`);
  } catch (err) {
    console.error("🔥 Remove item error:", err.message);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/cart/update", async (req, res) => {
  try {
    const { userId, name, quantity } = req.body;
    const cartRef = db.collection("carts").doc(userId);
    const doc = await cartRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const items = doc.data().items || [];
    const updatedItems = items.map((item) =>
      item.name === name ? { ...item, quantity } : item
    );

    await cartRef.update({ items: updatedItems });

    res.json({ message: "Quantity updated", items: updatedItems });
    console.log(`✅ Updated ${name} quantity to ${quantity}`);
  } catch (err) {
    console.error("🔥 Update error:", err.message);
    res.status(500).json({ error: "Failed to update quantity" });
  }
});

app.post("/api/cart", async (req, res) => {
  try {
    const { userId, name, price, image, quantity } = req.body;

    if (
      !userId ||
      !name ||
      price === undefined ||
      !image ||
      quantity === undefined
    ) {
      return res.status(400).json({ error: "Invalid cart item data" });
    }

    const cartRef = db.collection("carts").doc(userId);

    await cartRef.set(
      {
        items: admin.firestore.FieldValue.arrayUnion({
          name,
          price,
          image,
          quantity,
        }),
      },
      { merge: true }
    );

    res.json({ message: "Item added to cart" });
    console.log("✅ Item added to cart:", name);
  } catch (err) {
    console.error("🔥 Firestore error:", err.message);
    res.status(500).json({ error: "Failed to add item" });
  }
});

app.delete("/api/delete-user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    await db.collection("carts").doc(uid).delete();

    res.json({ message: "User data deleted from Firestore" });
    console.log(`🗑️ Deleted user Firestore data: ${uid}`);
  } catch (err) {
    console.error("🔥 Delete user error:", err.message);
    res.status(500).json({ error: "Failed to delete user data" });
  }
});

app.get("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const cartRef = db.collection("carts").doc(userId);
    const doc = await cartRef.get();

    if (!doc.exists) {
      return res.json({ items: [] });
    }
    res.json(doc.data());
  } catch (err) {
    console.error("🔥 Cart load error:", err.message);
    res.status(500).json({ error: "Failed to load cart" });
  }
});

// Local development (with PORT)
// On Vercel, this part will be ignored.
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally at http://localhost:${PORT}`);
  });
}

// Export handler for Vercel
module.exports = app;
