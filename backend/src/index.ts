import app from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./lib/logger.js";

app.listen(config.port, () => {
  logger.info(`CHAINTRACE API listening on port ${config.port}`);
});
