import logger from "shared/lib/logger";
import { initializeRedisClients } from "shared/lib/redis";
import { getIp } from "shared/utils/ip";
import app from "./index";

const PORT = process.env.PORT || 3000;

initializeRedisClients().catch((error) => {
  logger.error("Redis initialization failed:", { error, ip: getIp() });
  process.exit(1);
});
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`, { ip: getIp() });
});
