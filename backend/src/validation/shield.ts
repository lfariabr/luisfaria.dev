import { shield, rule, allow } from 'graphql-shield';
import { GraphQLError } from 'graphql';
import { checkAuth, checkRole } from '../utils/authUtils';
import { validateInput } from './middleware';
import { registerSchema, loginSchema } from './schemas/user.schema';
import { projectInputSchema, projectUpdateSchema } from './schemas/project.schema';
import { articleInputSchema, articleUpdateSchema } from './schemas/article.schema';
import { chatbotInputSchema } from './schemas/chatbot.schema';
import { screamInputSchema } from './schemas/scream.schema';
import { CheckoutInputSchema } from './schemas/checkout.schema';

// Authentication rules
const isAuthenticated = rule({ cache: 'contextual' })(
  async (_parent: any, _args: any, context: any) => {
    try {
      checkAuth(context);
      return true;
    } catch (error) {
      return new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
    }
  }
);

const isAdmin = rule({ cache: 'contextual' })(
  async (_parent: any, _args: any, context: any) => {
    try {
      checkRole(context, 'ADMIN');
      return true;
    } catch (error) {
      return new GraphQLError('Not authorized', {
        extensions: { code: 'FORBIDDEN' }
      });
    }
  }
);

// Validation rules
const validateRegister = rule({ cache: 'no_cache' })(
  validateInput(registerSchema)
);

const validateLogin = rule({ cache: 'no_cache' })(
  validateInput(loginSchema)
);

const validateProjectInput = rule({ cache: 'no_cache' })(
  validateInput(projectInputSchema)
);

const validateProjectUpdate = rule({ cache: 'no_cache' })(
  validateInput(projectUpdateSchema, 'input')
);

const validateArticleInput = rule({ cache: 'no_cache' })(
  validateInput(articleInputSchema)
);

const validateArticleUpdate = rule({ cache: 'no_cache' })(
  validateInput(articleUpdateSchema, 'input')
);

const validateChatbotInput = rule({ cache: 'no_cache' })(
  validateInput(chatbotInputSchema, 'question')
);

const validateScreamInput = rule({ cache: 'no_cache' })(
  validateInput(screamInputSchema, 'input')
);

const validateCheckout = rule({ cache: 'no_cache' })(
  validateInput(CheckoutInputSchema, 'input')
);

// Helper function to combine rules
function and(...rules: any[]) {
  return rule({ cache: 'no_cache' })(async (parent: any, args: any, context: any, info: any) => {
    for (const r of rules) {
      const result = await r.resolve(parent, args, context, info);
      if (!result) return false;
    }
    return true;
  });
}

// Export shield middleware
export const permissions = shield(
  {
    Query: {
      // Public queries
      hello: allow,
      projects: allow,
      project: allow,
      featuredProjects: allow,
      articles: allow,
      article: allow,
      articleBySlug: allow,
      publishedArticles: allow,
      articlesByCategory: allow,
      articlesByTag: allow,
      checkoutSessionStatus: allow,

      // Protected queries
      me: isAuthenticated,
      chatHistory: isAuthenticated,
      testRateLimit: isAuthenticated,
    },
    Mutation: {
      // Public mutations
      register: validateRegister,
      login: validateLogin,
      createCheckoutSession: validateCheckout,
      
      // Admin-only mutations
      createProject: and(isAdmin, validateProjectInput),
      updateProject: and(isAdmin, validateProjectUpdate),
      deleteProject: isAdmin,
      createArticle: and(isAdmin, validateArticleInput),
      updateArticle: and(isAdmin, validateArticleUpdate),
      deleteArticle: isAdmin,
      publishArticle: isAdmin,
      unpublishArticle: isAdmin,
      
      // User mutations
      askQuestion: and(isAuthenticated, validateChatbotInput),
      activateGogginsMode: validateScreamInput,
      logout: isAuthenticated,
      sendGogginsEmail: isAuthenticated,
    },
  },
  {
    fallbackError: (error: unknown) => {
      return error instanceof Error 
        ? error 
        : new Error((error as any)?.message || 'Permission denied');
    }
  }
);
