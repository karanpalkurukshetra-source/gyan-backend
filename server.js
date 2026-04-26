
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
  key_id: "rzp_test_SerE3RxUlQTa9d",
  key_secret: "ZL0fGV3bv6a0aAExAB66EgxH"
});

// 🔥 Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 👉 CREATE ORDER
app.post("/create-order", async (req, res) => {

  const { amount } = req.body;   // 🔥 GET FROM FRONTEND

  const order = await razorpay.orders.create({
    amount: amount,              // ✅ dynamic amount
    currency: "INR"
  });

  res.json(order);
});
// 👉 VERIFY PAYMENT
app.post("/verify-payment", async (req, res) => {

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    uid
  } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSign = crypto
    .createHmac("sha256", "ZL0fGV3bv6a0aAExAB66EgxH")
    .update(sign)
    .digest("hex");

  if(expectedSign === razorpay_signature){

    await db.collection("users").doc(uid).update({
      paid: true,
      expiryDate: Date.now() + (30*24*60*60*1000)
    });

    res.json({ success: true });

  } else {
    res.json({ success: false });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
