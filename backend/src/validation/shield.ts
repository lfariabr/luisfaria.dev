import { shield, rule, allow, and } from 'graphql-shield';
import { GraphQLError } from 'graphql';
import { checkAuth, checkRole } from '../utils/authUtils';
import { UserRole } from '../models/User';
import { validateInput } from './middleware';
import { registerSchema, loginSchema } from './schemas/user.schema';
import { projectInputSchema, projectUpdateSchema } from './schemas/project.schema';
import { articleInputSchema, articleUpdateSchema } from './schemas/article.schema';
import { chatbotInputSchema } from './schemas/chatbot.schema';
import { screamInputSchema } from './schemas/scream.schema';
import { CheckoutInputSchema } from './schemas/checkout.schema';
import { noteInputSchema, noteUpdateSchema, noteIdSchema, noteFiltersSchema } from './schemas/notes.schema';
import { pinInputSchema } from './schemas/pin.schema';
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

const canViewRelationshipPins = rule({ cache: 'contextual' })(
  async (_parent: any, _args: any, context: any) => {
    try {
      const user = checkAuth(context);
      if (user.role === UserRole.ADMIN || user.role === UserRole.PARTNER) {
        return true;
      }
      return new GraphQLError('Not authorized', {
        extensions: { code: 'FORBIDDEN' }
      });
    } catch (error) {
      return new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
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

const validateNoteInput = rule({ cache: 'no_cache' })(
  validateInput(noteInputSchema)
);

const validateNoteUpdate = rule({ cache: 'no_cache' })(
  validateInput(noteUpdateSchema, 'input')
);

const validateNoteId = rule({ cache: 'no_cache' })(
  validateInput(noteIdSchema, 'id')
);

const validateNoteFilters = rule({ cache: 'no_cache' })(
  async (_parent: unknown, args: unknown) => {
    const result = noteFiltersSchema.safeParse(args);
    if (!result.success) {
      return new GraphQLError(`Validation error: ${result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    return true;
  }
);

const validatePinInput = rule({ cache: 'no_cache' })(
  validateInput(pinInputSchema, 'input')
);

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
      myNotes: and(isAuthenticated, validateNoteFilters),
      note: and(isAuthenticated, validateNoteId),
      pins: canViewRelationshipPins,
      relationshipHomeLocation: canViewRelationshipPins,
    },
    Mutation: {
      // Public mutations
      register: validateRegister,
      login: validateLogin,
      createCheckoutSession: validateCheckout,
      
      // Admin-only mutations
      createPin: and(isAdmin, validatePinInput),
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
      createNote: and(isAuthenticated, validateNoteInput),
      updateNote: and(isAuthenticated, validateNoteId, validateNoteUpdate),
      deleteNote: and(isAuthenticated, validateNoteId),
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
