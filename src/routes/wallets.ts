import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createWallet, getWallet, deposit, withdraw } from "../controllers/walletController";

const router = Router();
router.use(requireAuth);
router.post("/", createWallet);
router.get("/:id", getWallet);
router.post("/:id/deposit", deposit);
router.post("/:id/withdraw", withdraw);
export default router;