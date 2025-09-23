import express, { Response, Request, Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../docs/swagger.json';
import { registerRoutes } from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { doubleCsrf } from 'csrf-csrf';

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
  if (
    req.path === '/api/auth/login' ||
    req.path === '/api/auth/refresh' ||
    req.path === '/api/auth/csrf-token'
  ) {
    return next();
  }
  return doubleCsrfProtection(req, res, next);
});

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
