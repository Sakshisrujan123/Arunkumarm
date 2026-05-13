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

function sanitize(val: string | undefined): string {
  if (!val) return "";
  return val.trim().replace(/^["'](.+)["']$/, '$1');
}

function getRazorpay() {
  if (!razorpayInstance) {
    // Prioritize non-VITE keys on backend if they exist independently
    const key_id = sanitize(process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID);
    const key_secret = sanitize(process.env.RAZORPAY_KEY_SECRET);

    if (!key_id || key_id.includes("placeholder") || !key_secret || key_secret.includes("placeholder")) {
      console.error("CRITICAL: Razorpay API keys are missing or invalid in environment variables.");
      console.error("Checked: RAZORPAY_KEY_ID, VITE_RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET");
    } else {
      console.log(`Razorpay instance initialized with ID: ${key_id.substring(0, 8)}...`);
    }

    razorpayInstance = new Razorpay({
      key_id: key_id || "invalid_id",
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

  // API Route: Get Public Config
  app.get("/api/config", (req, res) => {
    const key_id = sanitize(process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "");
    const key_secret = sanitize(process.env.RAZORPAY_KEY_SECRET);
    const isConfigured = !!key_id && !key_id.includes("placeholder") && !!key_secret && !key_secret.includes("placeholder");
    
    res.json({
      razorpayKeyId: key_id || null,
      isConfigured: isConfigured
    });
  });

  // API Route: Create Razorpay Order
  app.post("/api/create-order", async (req, res) => {
    const { amount } = req.body;
    
    const key_id = sanitize(process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID);
    const key_secret = sanitize(process.env.RAZORPAY_KEY_SECRET);

    if (!key_id || !key_secret || key_id.includes("placeholder")) {
      return res.status(500).json({ 
        error: "Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the Secrets panel." 
      });
    }

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
      console.error("Razorpay Order Error Details:", JSON.stringify(error, null, 2));
      const description = error?.error?.description || error?.message || "Authentication failed";
      res.status(500).json({ error: `Razorpay Error: ${description}. Check your keys in the Secrets panel.` });
    }
  });

  // API Route: Verify Payment Signature
  app.post("/api/verify-payment", async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required payment fields" });
    }

    const key_secret = sanitize(process.env.RAZORPAY_KEY_SECRET || "");
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
