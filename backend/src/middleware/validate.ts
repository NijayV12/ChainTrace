import { body, param, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export function handleValidation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
}

export const registerSchema = [
  body("name").trim().notEmpty().withMessage("Name required"),
  body("email").isEmail().normalizeEmail(),
  body("phone").optional().trim(),
  body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
];

export const loginSchema = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

export const verificationSchema = [
  body("platform").trim().notEmpty(),
  body("handle").trim().notEmpty(),
  body("accountAge").isInt({ min: 0 }),
  body("followers").isInt({ min: 0 }),
  body("following").isInt({ min: 0 }),
  body("posts").isInt({ min: 0 }),
  body("profileComplete").isBoolean(),
];

export const uuidParam = [param("id").isUUID()];
