import dotenv from 'dotenv';
import app from './index';
import logger from 'shared/lib/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
}); 