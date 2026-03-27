import { Router, type Response } from "express";
import { authMiddleware, type AuthRequest } from "../auth/middleware.js";
import {
  submitVerification,
  getVerificationResult,
  listUserAccounts,
} from "../services/verificationService.js";
import { verificationSchema, uuidParam, handleValidation } from "../middleware/validate.js";

const router = Router();
router.use(authMiddleware);

router.get("/accounts", async (req: AuthRequest, res: Response) => {
  const accounts = await listUserAccounts(req.user!.userId);
  res.json(accounts);
});

router.post(
  "/verify",
  verificationSchema,
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const account = await submitVerification({
      userId,
      platform: req.body.platform,
      handle: req.body.handle,
      accountAge: req.body.accountAge,
      followers: req.body.followers,
      following: req.body.following,
      posts: req.body.posts,
      profileComplete: req.body.profileComplete,
    });
    res.status(201).json(account);
  }
);

router.get("/accounts/:id/result", uuidParam, handleValidation, async (req: AuthRequest, res: Response) => {
  const result = await getVerificationResult(req.params.id, req.user!.userId);
  if (!result) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json(result);
});

export default router;
