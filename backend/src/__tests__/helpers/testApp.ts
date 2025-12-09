import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { typeDefs } from '../../schemas/typeDefs';
import { resolvers } from '../../resolvers';
import { permissions } from '../../validation/shield';
import { getUser } from '../../middleware/auth';

// Dummy test to avoid Jest's "no tests" error
describe('Test App Helper', () => {
  it('should export createTestApp function', () => {
    expect(typeof createTestApp).toBe('function');
  });
});

/**
 * Creates a fully configured Express app with Apollo Server for integration testing.
 * This tests the FULL cookie-parsing flow end-to-end.
 */
export const createTestApp = async (): Promise<{ app: Express; server: ApolloServer }> => {
  const app = express();
  
  // Configure CORS for testing
  const corsOptions = {
    origin: true, // Allow all origins in test
    credentials: true
  };
  
  // Apply middleware in the same order as production
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(cookieParser());
  
  // Create schema with permissions middleware
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const schemaWithMiddleware = applyMiddleware(schema, permissions);
  
  const server = new ApolloServer({
    schema: schemaWithMiddleware,
  });
  
  await server.start();
  
  app.use('/graphql',
    express.json(),
    cors(corsOptions),
    // @ts-ignore
    expressMiddleware(server, {
      context: async ({ req, res }: any) => {
        // This is the REAL cookie parsing flow
        const user = getUser(req);
        return { user, req, res };
      },
    })
  );
  
  return { app, server };
};
