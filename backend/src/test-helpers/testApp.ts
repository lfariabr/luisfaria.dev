import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { ApolloServer, BaseContext } from '@apollo/server';
import { expressMiddleware, ExpressContextFunctionArgument } from '@as-integrations/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { typeDefs } from '../schemas/typeDefs';
import { resolvers } from '../resolvers';
import { permissions } from '../validation/shield';
import { getUser } from '../middleware/auth';

// Define the context type for Apollo Server
interface Context extends BaseContext {
  user: ReturnType<typeof getUser>;
  req: ExpressContextFunctionArgument['req'];
  res: ExpressContextFunctionArgument['res'];
}

// Typed context function for Apollo Express middleware
const createContext = async (
  arg: ExpressContextFunctionArgument
): Promise<Context> => {
  // Cast through unknown to bridge Apollo's bundled @types/express with project's version
  const user = getUser(arg.req as unknown as Parameters<typeof getUser>[0]);
  return { user, req: arg.req, res: arg.res };
};

/**
 * Creates a fully configured Express app with Apollo Server for integration testing.
 * This tests the FULL cookie-parsing flow end-to-end.
 */
export const createTestApp = async (): Promise<{ app: Express; server: ApolloServer<Context> }> => {
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
  
  const server = new ApolloServer<Context>({
    schema: schemaWithMiddleware,
  });
  
  await server.start();
  
  app.use('/graphql',
    express.json(),
    cors(corsOptions),
    // Type assertion needed due to Apollo Server 4's bundled @types/express conflicting with project's version
    expressMiddleware(server, {
      context: createContext,
    }) as unknown as express.RequestHandler
  );
  
  return { app, server };
};
