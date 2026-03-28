import "express-async-errors";
import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import blockchainRoutes from "./routes/blockchainRoutes.js";
import adminRoutes from "./admin/adminRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.cors.allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      if (config.cors.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/users`, userRoutes);
app.use(`${config.apiPrefix}/blockchain`, blockchainRoutes);
app.use(`${config.apiPrefix}/admin`, adminRoutes);
app.use(`${config.apiPrefix}/cases`, caseRoutes);
app.use(`${config.apiPrefix}/assistant`, assistantRoutes);

app.use(errorHandler);

export default app;
