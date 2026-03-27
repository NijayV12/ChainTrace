import { Router } from "express";
import {
  getChainExplorerData,
  getBlockByHash,
  getBlockByIndex,
} from "../services/blockchainService.js";

const router = Router();

router.get("/explorer", (_req, res) => {
  const data = getChainExplorerData();
  res.json(data);
});

router.get("/blocks/:hash", (req, res) => {
  const block = getBlockByHash(req.params.hash);
  if (!block) {
    res.status(404).json({ error: "Block not found" });
    return;
  }
  res.json(block);
});

router.get("/blocks/index/:index", (req, res) => {
  const index = parseInt(req.params.index, 10);
  if (Number.isNaN(index) || index < 0) {
    res.status(400).json({ error: "Invalid index" });
    return;
  }
  const block = getBlockByIndex(index);
  if (!block) {
    res.status(404).json({ error: "Block not found" });
    return;
  }
  res.json(block);
});

export default router;
