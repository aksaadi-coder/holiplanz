import "dotenv/config";
import express from "express";
import cors from "cors";
import itineraryRouter from "./routes/itinerary.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  const required = process.env.ACCESS_CODE;
  if (!required) {
    next();
    return;
  }
  const expiresAt = process.env.ACCESS_CODE_EXPIRES_AT;
  if (expiresAt && Date.now() > new Date(expiresAt).getTime()) {
    res.status(403).json({ error: "This shared link has expired." });
    return;
  }
  const provided = req.header("x-access-code");
  if (provided !== required) {
    res.status(401).json({ error: "Access code required." });
    return;
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, anthropicKeyPresent: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.use("/api/itinerary", itineraryRouter);

export default app;
