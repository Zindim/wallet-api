import { Response } from "express";
import { pool } from "../db/pool"; //get into how pool works
import { AuthedRequest } from "../middleware/auth";

export async function transfer(req: AuthedRequest, res: Response) {
  const { fromWalletId, toWalletId, amount, idempotencyKey } = req.body;

  const existing = await pool.query(
    "SELECT * FROM transactions WHERE idempotency_key = $1", [idempotencyKey]
  );
  if (existing.rows[0]) return res.json(existing.rows[0]);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const debited = await client.query(
      "UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance",
      [amount, fromWalletId]
    );
    if (debited.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "insufficient funds" });
    }

    const credited = await client.query(
      "UPDATE wallets SET balance = balance + $1 WHERE id = $2 RETURNING balance",
      [amount, toWalletId]
    );
    if (credited.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "destination wallet not found" });
    }

    const tx = await client.query(
      `INSERT INTO transactions (idempotency_key, type, from_wallet_id, to_wallet_id, amount)
       VALUES ($1, 'transfer', $2, $3, $4) RETURNING *`,
      [idempotencyKey, fromWalletId, toWalletId, amount]
    );

    await client.query("COMMIT");
    res.status(201).json({
      ...tx.rows[0],
      fromBalance: debited.rows[0].balance,
      toBalance: credited.rows[0].balance,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}