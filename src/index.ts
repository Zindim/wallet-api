import express from "express";
import dotenv from "dotenv";
import { pool } from "./db/pool";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/db-test", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));