import { Router, type Response } from "express";
import { authMiddleware, requireRole, type AuthRequest } from "../auth/middleware.js";
import {
  createCase,
  listCasesForUser,
  getCaseById,
  updateCaseStatus,
  addInvestigatorReport,
  addAnalystDecision,
  addCaseNote,
  draftInvestigatorReport,
  draftAnalystDecision,
} from "../services/caseService.js";
import { handleValidation, uuidParam } from "../middleware/validate.js";
import { body } from "express-validator";

const router = Router();

router.use(authMiddleware);

// List cases visible to the current user.
router.get("/", async (req: AuthRequest, res: Response) => {
  const cases = await listCasesForUser({
    userId: req.user!.userId,
    role: req.user!.role,
  });
  res.json(cases);
});

// Create a new case – investigators and super admins.
router.post(
  "/",
  requireRole("INVESTIGATOR", "SUPER_ADMIN"),
  [
    body("title").trim().notEmpty(),
    body("description").optional().trim(),
    body("assignedToId").optional().isString(),
    body("accountIds").optional().isArray(),
  ],
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const caseRecord = await createCase({
      title: req.body.title,
      description: req.body.description,
      createdById: req.user!.userId,
      assignedToId: req.body.assignedToId,
      accountIds: (req.body.accountIds as string[]) ?? [],
    });
    res.status(201).json(caseRecord);
  }
);

// Get a single case with reports/decisions/notes.
router.get("/:id", uuidParam, handleValidation, async (req: AuthRequest, res: Response) => {
  const c = await getCaseById(req.params.id);
  if (!c) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  res.json(c);
});

// Update case status / assignment – investigators and super admins.
router.patch(
  "/:id/status",
  requireRole("INVESTIGATOR", "SUPER_ADMIN"),
  [
    ...uuidParam,
    body("status")
      .isIn(["OPEN", "MONITORING", "ACTION_TAKEN", "CLOSED"])
      .withMessage("Invalid status"),
    body("assignedToId").optional().isString(),
  ],
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const updated = await updateCaseStatus({
      id: req.params.id,
      status: req.body.status,
      assignedToId: req.body.assignedToId,
    });
    res.json(updated);
  }
);

// Investigator report.
router.post(
  "/:id/reports",
  requireRole("INVESTIGATOR", "SUPER_ADMIN"),
  [
    ...uuidParam,
    body("summary").trim().notEmpty(),
    body("recommendation").trim().notEmpty(),
  ],
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const report = await addInvestigatorReport({
      caseId: req.params.id,
      authorId: req.user!.userId,
      summary: req.body.summary,
      recommendation: req.body.recommendation,
    });
    res.status(201).json(report);
  }
);

// Analyst decision.
router.post(
  "/:id/decisions",
  requireRole("ANALYST", "SUPER_ADMIN"),
  [
    ...uuidParam,
    body("riskRating").trim().notEmpty(),
    body("decision").trim().notEmpty(),
    body("rationale").trim().notEmpty(),
  ],
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const decision = await addAnalystDecision({
      caseId: req.params.id,
      analystId: req.user!.userId,
      riskRating: req.body.riskRating,
      decision: req.body.decision,
      rationale: req.body.rationale,
    });
    res.status(201).json(decision);
  }
);

// Notes (both investigators and analysts can comment).
router.post(
  "/:id/notes",
  requireRole("INVESTIGATOR", "ANALYST", "SUPER_ADMIN"),
  [...uuidParam, body("body").trim().notEmpty()],
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const note = await addCaseNote({
      caseId: req.params.id,
      authorId: req.user!.userId,
      body: req.body.body,
    });
    res.status(201).json(note);
  }
);

// Draft investigator report (LLM-assisted via existing scores & alerts).
router.post(
  "/:id/investigator-report/draft",
  requireRole("INVESTIGATOR", "SUPER_ADMIN"),
  uuidParam,
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const draft = await draftInvestigatorReport(req.params.id);
    if (!draft) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    res.json(draft);
  }
);

// Draft analyst decision.
router.post(
  "/:id/analyst-decision/draft",
  requireRole("ANALYST", "SUPER_ADMIN"),
  uuidParam,
  handleValidation,
  async (req: AuthRequest, res: Response) => {
    const draft = await draftAnalystDecision(req.params.id);
    if (!draft) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    res.json(draft);
  }
);

// Export case as JSON bundle.
router.get("/:id/export", uuidParam, handleValidation, async (req: AuthRequest, res: Response) => {
  const c = await getCaseById(req.params.id);
  if (!c) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  res.setHeader("Content-Type", "application/json");
  res.json(c);
});

export default router;

