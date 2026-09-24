# Wallet API

A backend REST API simulating a digital wallet — deposits, withdrawals, and transfers between users — built to demonstrate the correctness guarantees real payment systems need: atomic balance updates and safe handling of retried requests.

**Live demo:** https://wallet-api-096w.onrender.com/health
*(Free-tier hosting — the first request after inactivity may take up to a minute to wake up.)*

## Stack
- TypeScript + Express
- PostgreSQL (hosted on Neon)
- JWT authentication, bcrypt password hashing
- Docker + Docker Compose for local development
- Jest + Supertest for automated tests
- Deployed on Render

## The two problems this project actually solves

**1. Idempotency — safe retries.**
If a client's request times out or the network drops after the server already processed it, a naive retry would double-charge the user. Every money-moving endpoint (`deposit`, `withdraw`, `transfer`) requires an `idempotencyKey`. The first request with a given key is processed normally; any repeat of that same key returns the original result instead of processing again — enforced both in application logic and with a `UNIQUE` database constraint as a second line of defense.

**2. Atomicity — no partial money movement.**
A transfer touches two wallets. If the server crashed between debiting one and crediting the other, money would simply vanish. Every balance change runs inside a database transaction (`BEGIN`/`COMMIT`/`ROLLBACK`), and the balance check itself happens atomically inside the `UPDATE` statement (`WHERE balance >= amount`) rather than as a separate read-then-write — closing the race condition where two simultaneous withdrawals could both pass a balance check before either one actually deducts anything.

## API overview

| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Get a JWT |
| POST | `/wallets` | Create a wallet |
| GET | `/wallets/:id` | View balance |
| POST | `/wallets/:id/deposit` | Deposit funds |
| POST | `/wallets/:id/withdraw` | Withdraw funds |
| POST | `/wallets/transfers` | Transfer between wallets |
| GET | `/wallets/:id/transactions` | View transaction history |

All wallet routes require `Authorization: Bearer <token>`.

## Running it locally

```bash
docker compose up --build
```
This starts the API and a Postgres instance together. Then apply the schema:
```bash
docker compose exec -T db psql -U postgres -d wallet_dev < src/db/schema.sql
```

## Example usage

```bash
# Register
curl -X POST https://wallet-api-096w.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "yourpassword"}'

# Log in
curl -X POST https://wallet-api-096w.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "yourpassword"}'

# Create a wallet (use the token from login)
curl -X POST https://wallet-api-096w.onrender.com/wallets \
  -H "Authorization: Bearer YOUR_TOKEN"

# Deposit funds
curl -X POST https://wallet-api-096w.onrender.com/wallets/YOUR_WALLET_ID/deposit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "idempotencyKey": "unique-string-1"}'

# Retry the same deposit — proves idempotency, balance won't double
curl -X POST https://wallet-api-096w.onrender.com/wallets/YOUR_WALLET_ID/deposit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "idempotencyKey": "unique-string-1"}'
```


## Running tests
```bash
npx jest
```
Tests specifically cover the two problems above: rejecting a withdrawal that exceeds the balance, and confirming a repeated idempotency key doesn't create a duplicate transaction.

## What I'd add with more time
- Rate limiting on auth endpoints
- A mocked external "bank" webhook to simulate asynchronous payment confirmation
- Refresh tokens (current JWTs expire after 1 hour with no renewal path)
- An audit log separate from the transactions table
- A `GET /wallets` endpoint to list a user's own wallets
