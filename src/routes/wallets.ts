import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createWallet, getWallet, deposit, withdraw, getHistory } from "../controllers/walletController";
import { transfer } from "../controllers/transferController";

const router = Router();
router.use(requireAuth);
router.post("/", createWallet);
router.get("/:id", getWallet);
router.post("/transfers", transfer);
router.post("/:id/deposit", deposit);
router.post("/:id/withdraw", withdraw);
router.get("/:id/transactions", getHistory);
export default router;