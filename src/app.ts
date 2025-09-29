import express, { Response, Request, Application, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../docs/swagger.json';
import { registerRoutes } from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { doubleCsrf } from 'csrf-csrf';
import logger from './utils/logger';

const app: Application = express();
const theme = new SwaggerTheme();
const swaggerUiOptions = {
  explorer: true,
  customCss: theme.getBuffer(SwaggerThemeNameEnum.DRACULA).toString(),
  swaggerOptions: {
    persistAuthorization: true,
    requestInterceptor: (req: Request) => {
      // CSRF token akan otomatis disertakan dari cookie
      // Tidak perlu manual karena csrf-csrf library sudah handle ini
      return req;
    }
  }
};

app.set('trust proxy', 1);

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:8026'], // frontend React dev server dan Swagger UI
  methods: 'GET,PUT,PATCH,POST,DELETE',
  credentials: true,
  exposedHeaders: ['Content-Length', 'Content-Type'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Logging middleware untuk mencatat endpoint yang dihit
app.use((req: Request, res: Response, next) => {
  const startTime = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';

  logger.info({
    method,
    url,
    ip,
    userAgent,
    message: `Incoming request: ${method} ${url}`
  });

  // Gunakan event listener untuk mencatat response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    logger.info({
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent,
      message: `Response: ${method} ${url} - ${statusCode} (${duration}ms)`
    });
  });

  next();
});

// CSRF Protection Configuration
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () =>
    process.env.CSRF_SECRET || 'your-secret-key-change-this-in-production',
  getSessionIdentifier: (req) => req.ip || 'anonymous',
  cookieName: 'csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] as string
});

// Apply CSRF protection to all routes except auth endpoints
app.use((req, res, next) => {
  // Skip CSRF for auth endpoints that don't need it
  if (req.path === '/api/auth/login' || req.path === '/api/auth/refresh') {
    logger.info({
      method: req.method,
      url: req.url,
      ip: req.ip,
      message: 'CSRF protection skipped for auth endpoint'
    });
    return next();
  }

  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    csrf_token: req.headers['x-csrf-token'] ? 'provided' : 'missing',
    message: 'CSRF protection applied'
  });

  return doubleCsrfProtection(req, res, next);
});

// CSRF Error handling middleware
app.use(
  (
    err: Error & { code?: string },
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (err.code === 'EBADCSRFTOKEN') {
      logger.warn({
        method: req.method,
        url: req.url,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        csrf_token: req.headers['x-csrf-token'] ? 'provided' : 'missing',
        error: err.message,
        message: 'CSRF token validation failed'
      });

      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        status_code: StatusCodes.FORBIDDEN,
        message: 'CSRF token tidak valid atau tidak ditemukan'
      });
    }
    next(err);
  }
);

// Make CSRF utilities available globally
app.locals.generateToken = generateCsrfToken;

app.get('/', (req: Request, res: Response) => {
  res.json('Welcome to SIM Service');
});

// Auth endpoints sudah dipindahkan ke auth routes

// Register routes
registerRoutes(app);

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, swaggerUiOptions)
);

// Error handling middleware
app.use(errorMiddleware);

app.use((req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status_code: StatusCodes.NOT_FOUND,
    message: ReasonPhrases.NOT_FOUND
  });
});

export default app;
