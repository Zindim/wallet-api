import { Response } from "express";
import { pool } from "../db/pool";
import { AuthedRequest } from "../middleware/auth";

export async function createWallet(req: AuthedRequest, res: Response) {
  const result = await pool.query(
    "INSERT INTO wallets (user_id) VALUES ($1) RETURNING id, balance",
    [req.userId]
  );
  res.status(201).json(result.rows[0]);
}

export async function getWallet(req: AuthedRequest, res: Response) {
  const result = await pool.query(
    "SELECT id, balance FROM wallets WHERE id = $1 AND user_id = $2",
    [req.params.id, req.userId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "wallet not found" });
  res.json(result.rows[0]);
}

export async function deposit(req: AuthedRequest, res: Response) {
  const { amount, idempotencyKey } = req.body;
  const walletId = req.params.id;

  const existing = await pool.query(
    "SELECT * FROM transactions WHERE idempotency_key = $1", [idempotencyKey]
  );
  if (existing.rows[0]) return res.json(existing.rows[0]);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      "UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3 RETURNING balance",
      [amount, walletId, req.userId]
    );
    if (updated.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "wallet not found" });
    }
    const tx = await client.query(
      `INSERT INTO transactions (idempotency_key, type, to_wallet_id, amount)
       VALUES ($1, 'deposit', $2, $3) RETURNING *`,
      [idempotencyKey, walletId, amount]
    );
    await client.query("COMMIT");
    res.status(201).json({ ...tx.rows[0], newBalance: updated.rows[0].balance });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function withdraw(req: AuthedRequest, res: Response) {
  const { amount, idempotencyKey } = req.body;
  const walletId = req.params.id;

  const existing = await pool.query(
    "SELECT * FROM transactions WHERE idempotency_key = $1", [idempotencyKey]
  );
  if (existing.rows[0]) return res.json(existing.rows[0]);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      "UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND user_id = $3 AND balance >= $1 RETURNING balance",
      [amount, walletId, req.userId]
    );
    if (updated.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "insufficient funds or wallet not found" });
    }
    const tx = await client.query(
      `INSERT INTO transactions (idempotency_key, type, from_wallet_id, amount)
       VALUES ($1, 'withdraw', $2, $3) RETURNING *`,
      [idempotencyKey, walletId, amount]
    );
    await client.query("COMMIT");
    res.status(201).json({ ...tx.rows[0], newBalance: updated.rows[0].balance });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}