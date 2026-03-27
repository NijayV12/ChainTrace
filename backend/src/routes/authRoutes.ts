import { Router, type Request, type Response } from "express";
import { login } from "../auth/service.js";
import { loginSchema, handleValidation } from "../middleware/validate.js";

const router = Router();

// Closed-access platform: only pre-provisioned agency accounts may log in.
// Public self-registration is not exposed as an API route.

router.post("/login", loginSchema, handleValidation, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await login(email, password, {
    ip: req.ip ?? req.socket?.remoteAddress,
    device: req.get("User-Agent") ?? undefined,
  });
  res.json(result);
});

export default router;
