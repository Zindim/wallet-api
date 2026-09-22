import request from "supertest";
import app from "../src/index";
import { pool } from "../src/db/pool";

let token: string;
let walletId: string;

beforeAll(async () => {
  const email = `test-${Date.now()}@example.com`; // unique each run, avoids "already registered" collisions
  await request(app).post("/auth/register").send({ email, password: "testpass123" });
  const loginRes = await request(app).post("/auth/login").send({ email, password: "testpass123" });
  token = loginRes.body.token;

  const walletRes = await request(app).post("/wallets").set("Authorization", `Bearer ${token}`);
  walletId = walletRes.body.id;
});

afterAll(async () => {
  await pool.end(); // closes the database connection pool so Jest actually exits cleanly
});

describe("deposit", () => {
  it("rejects withdrawal larger than balance", async () => {
    const res = await request(app)
      .post(`/wallets/${walletId}/withdraw`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 999999, idempotencyKey: `wd-${Date.now()}` });

    expect(res.status).toBe(400);
  });

  it("returns the same transaction when the same idempotency key is reused", async () => {
    const key = `dep-${Date.now()}`;

    const first = await request(app)
      .post(`/wallets/${walletId}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 500, idempotencyKey: key });

    const second = await request(app)
      .post(`/wallets/${walletId}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 500, idempotencyKey: key });

    expect(second.body.id).toBe(first.body.id);
  });
});