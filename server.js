const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());
app.use(cors());

// 🔐 Razorpay keys
const razorpay = new Razorpay({
  key_id: "rzp_live_SogWXmhEcYLSxM",
  key_secret: "A5H88ZlufcD7Oou2pd1bIuBz"
});

// 🔥 Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


// ✅ ROOT ROUTE (for testing)
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});


// 👉 CREATE ORDER (FIXED + SAFE)
app.post("/create-order", async (req, res) => {
  try {
    console.log("🔥 Create order called");

    const { amount } = req.body;
    console.log("RECEIVED AMOUNT:", amount);

    if (!amount) {
      return res.status(400).json({ error: "Amount missing" });
    }

    const order = await razorpay.orders.create({
amount: Number(amount),
      currency: "INR"
    });
console.log(order);
console.log("ORDER ID:", order.id);
    res.json(order);

  } catch (err) {
    console.error("❌ Create order error:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
});


// 👉 VERIFY PAYMENT (FIXED + SAFE)
app.post("/verify-payment", async (req, res) => {
  try {
    console.log("🔥 Verify payment called");

    const {
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  uid,
  subject
} = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", "A5H88ZlufcD7Oou2pd1bIuBz")
      .update(sign)
      .digest("hex");

    if (expectedSign === razorpay_signature) {

      const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000);

await db.collection("users").doc(uid).set({
  subjects: {
    [subject]: {
      active: true,
      expiryDate: expiry
    }
  }
}, { merge: true });

      return res.json({ success: true });

    } else {
      return res.json({ success: false });
    }

  } catch (err) {
    console.error("❌ Verify error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});


// ✅ PORT FIX (IMPORTANT FOR RENDER)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
