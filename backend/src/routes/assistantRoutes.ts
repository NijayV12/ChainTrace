import { Router, type Response } from "express";
import { body, query } from "express-validator";
import { authMiddleware, requireRole, type AuthRequest } from "../auth/middleware.js";
import { handleValidation } from "../middleware/validate.js";
import { generateAssistantReply, getAssistantHistory } from "../ai/assistantChat.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("SUPER_ADMIN", "ANALYST", "INVESTIGATOR"));

router.get(
  "/history",
  [query("caseId").optional().isUUID()],
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const result = await getAssistantHistory({
      userId: req.user!.userId,
      caseId: typeof req.query.caseId === "string" ? req.query.caseId : undefined,
    });
    res.json(result);
  }
);

router.post(
  "/chat",
  [
    body("message").trim().notEmpty().isLength({ min: 3, max: 2000 }),
    body("caseId").optional().isUUID(),
  ],
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const result = await generateAssistantReply({
      userId: req.user!.userId,
      message: req.body.message,
      role: req.user!.role,
      caseId: req.body.caseId,
    });
    res.json(result);
  }
);

export default router;
