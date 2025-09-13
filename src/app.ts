import express, { Response, Request, Application } from 'express';
import cors from 'cors';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../docs/swagger.json';
import { registerRoutes } from './routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app: Application = express();
const theme = new SwaggerTheme();
const swaggerUiOptions = {
  explorer: true,
  customCss: theme.getBuffer(SwaggerThemeNameEnum.DRACULA).toString()
};

app.set('trust proxy', 1);

const corsOptions = {
  origin: '*',
  methods: 'GET,PUT,PATCH,POST,DELETE',
  credentials: true,
  exposedHeaders: ['Content-Length', 'Content-Type']
};
app.use(cors(corsOptions));
app.use(express.json());

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
