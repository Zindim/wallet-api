import express from "express";
import dotenv from "dotenv";
import { pool } from "./db/pool";
import authRoutes from "./routes/auth";
import walletRoutes from "./routes/wallets";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/wallets", walletRoutes);
app.use("/auth", authRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/db-test", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows[0]);
});

app.use(errorHandler);

export default app;
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "test") {
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}