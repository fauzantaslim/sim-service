import app from './app';
import logger from './utils/logger';
import dotenv from 'dotenv';
dotenv.config();

const PORT: number = Number(process.env.PORT) || 8026;
const HOST: string = '0.0.0.0';

app.listen(PORT, HOST, () => {
  logger.info(`Server is running on http://${HOST}:${PORT}`);
});

export default app;
