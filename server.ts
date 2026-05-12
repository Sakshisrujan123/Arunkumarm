import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Razorpay from "razorpay";
import shortid from "shortid";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Razorpay lazily to ensure environment variables are loaded
let razorpayInstance: Razorpay | null = null;

function getRazorpay() {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || key_id.includes("placeholder") || !key_secret || key_secret.includes("placeholder")) {
      console.error("CRITICAL: Razorpay API keys are missing or invalid in environment variables.");
    } else {
      console.log(`Razorpay keys detected: ID starts with ${key_id.substring(0, 8)}..., Secret length is ${key_secret.length}`);
    }

    razorpayInstance = new Razorpay({
      key_id: key_id || "invalid_key",
      key_secret: key_secret || "invalid_secret",
    });
  }
  return razorpayInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route: Create Razorpay Order
  app.post("/api/create-order", async (req, res) => {
    const { amount } = req.body;
    console.log(`Order creation requested for amount: ${amount} INR`);

    if (!amount || amount < 1) {
      return res.status(400).json({ error: "Amount must be at least 1 INR" });
    }

    const razorpay = getRazorpay();
    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: "INR",
      receipt: shortid.generate(),
    };

    try {
      const response = await razorpay.orders.create(options);
      res.json({
        id: response.id,
        currency: response.currency,
        amount: response.amount,
      });
    } catch (error: any) {
      console.error("Razorpay Order Error:", JSON.stringify(error, null, 2));
      const description = error?.error?.description || "Authentication failed";
      res.status(500).json({ error: `Razorpay Error: ${description}. Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are correctly configured in the Secrets panel.` });
    }
  });

  // API Route: Verify Payment Signature
  app.post("/api/verify-payment", async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required payment fields" });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || "";
    const crypto = await import("crypto");
    const hmac = crypto.createHmac("sha256", key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Basic production serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
