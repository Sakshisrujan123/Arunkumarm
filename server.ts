import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Razorpay from "razorpay";
import shortid from "shortid";
import cors from "cors";

// Initialize Razorpay
// Note: In production, ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET 
// are added to your environment variables.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route: Create Razorpay Order
  app.post("/api/payment/order", async (req, res) => {
    const { amount } = req.body;

    const options = {
      amount: amount * 100, // Amount in paise (100 paise = 1 INR)
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
    } catch (error) {
      console.error("Razorpay Order Error:", error);
      res.status(500).json({ error: "Failed to create payment order" });
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
