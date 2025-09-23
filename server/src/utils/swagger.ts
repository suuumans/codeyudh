
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import { version } from '../../package.json'; // Assuming you have a package.json

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CodeYudh API',
      version,
      description: 'API documentation for the CodeYudh platform, a competitive programming application.',
      contact: {
        name: 'Suman', // Or your name/team
        url: 'https://codeyudh.com',
        email: 'suman@codeyudh.com',
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: `http://localhost:${process.env.PORT ?? 5050}/api/v1`,
        description: 'Local development server',
      },
      // your production server URL
      {
        url: 'https://api.codeyudh.com/api/v1', // Example production URL
        description: 'Production server',
      }
    ],
  },
  // Path to the API docs
  apis: ['./src/controllers/*.ts', './src/db/schema/*.ts'], // Point to your controller files
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  // Serve swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📄 API Docs available at http://localhost:${process.env.PORT ?? 5050}/api-docs`);
}
