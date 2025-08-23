const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, "docs")));
app.use(bodyParser.json());

// ✅ Load Firebase credentials
const serviceAccount = JSON.parse(process.env.VERCEL_FIREBASE_KEY);
console.log("Service Account Loaded:", serviceAccount.project_id); // debug

// ✅ Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "index.html"));
});
// ✅ Update item quantity in cart
app.post("/api/cart/update", async (req, res) => {
  try {
    const { userId, name, quantity } = req.body;
    const cartRef = db.collection("carts").doc(userId);
    const doc = await cartRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const items = doc.data().items || [];
    const updatedItems = items.map(item =>
      item.name === name ? { ...item, quantity } : item
    );

    await cartRef.update({ items: updatedItems });

    res.json({ message: "Quantity updated", items: updatedItems });
    console.log(`✅ Updated ${name} quantity to ${quantity}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update quantity" });
  }
});


// Example: add item to cart
// Example: add item to cart
app.post("/api/cart", async (req, res) => {
  try {
    const { userId, name, price, image, quantity } = req.body;

    // 🔍 Validate inputs
    if (!userId || !name || price === undefined || !image || quantity === undefined) {
      return res.status(400).json({ error: "Invalid cart item data" });
    }

    const cartRef = db.collection("carts").doc(userId);

    await cartRef.set(
      {
        items: admin.firestore.FieldValue.arrayUnion({
          name,
          price,
          image,
          quantity
        })
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


// backend (server.js)
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
    console.error(err);
    res.status(500).json({ error: "Failed to load cart" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
