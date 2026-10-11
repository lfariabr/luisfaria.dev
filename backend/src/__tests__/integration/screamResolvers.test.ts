import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import { connectRedis, disconnectRedis, getRedisClient } from '../../services/redis';

// Mock OpenAI service
jest.mock('../../services/openai', () => ({
  chatWithGogginsMode: jest.fn().mockResolvedValue('This is a mock AI response'),
}));

// Define test queries and mutations
const ACTIVATE_GOGGINS_MODE_MUTATION = `
  mutation ActivateGogginsMode($input: ScreamInput!) {
    activateGogginsMode(input: $input) {
      id
      userEmail
      text
      modelUsed
      explicitMode
      isSubscriber
      createdAt
      rateLimitInfo {
        limit
        remaining
        resetTime
      }
    }
  }
`;
  
// Define the expected types for our GraphQL responses
interface ScreamType {
  id: string;
  userEmail: string;
  text: string;
  modelUsed: string;
  explicitMode: boolean;
  isSubscriber: boolean;
  createdAt: string;
  rateLimitInfo: {
    limit: number;
    remaining: number;
    resetTime: string;
  };
}

// Type guard function to check if an object matches our expected structure
function isScreamResponse(obj: any): obj is { activateGogginsMode: ScreamType } {
  return (
    obj &&
    typeof obj === 'object' &&
    'activateGogginsMode' in obj &&
    typeof obj.activateGogginsMode === 'object' &&
    obj.activateGogginsMode !== null &&
    'id' in obj.activateGogginsMode &&
    'userEmail' in obj.activateGogginsMode &&
    'text' in obj.activateGogginsMode &&
    'modelUsed' in obj.activateGogginsMode &&
    'explicitMode' in obj.activateGogginsMode &&
    'isSubscriber' in obj.activateGogginsMode &&
    'createdAt' in obj.activateGogginsMode &&
    'rateLimitInfo' in obj.activateGogginsMode
  );
}

// Connect to database and Redis before tests
beforeAll(async () => {
  await dbHandler.connect();
  await connectRedis();
  // Clear any existing rate limit data
  const redisClient = getRedisClient();
  await redisClient.flushDb();
});

// Disconnect after tests
afterAll(async () => {
  await dbHandler.closeDatabase();
  await disconnectRedis();
});

// Send a valid mutation
it('should successfully input an email and get a response', async () => {
  const variables = {
    input: {
      userEmail: 'test@example.com',
      explicitMode: false,
    },
  };
  
  // Mutation does not require auth; empty context is fine
  const response = await executeOperation(ACTIVATE_GOGGINS_MODE_MUTATION, variables, {});
  
  // Check no errors occurred
  expect(response.body.kind).toBe('single');
  
  if (response.body.kind === 'single') {
    const { data, errors } = response.body.singleResult;
    
    expect(errors).toBeUndefined();
    expect(data).toBeDefined();
    
    // Validate that data has the expected structure using our type guard
    expect(isScreamResponse(data)).toBe(true);
    
    if (isScreamResponse(data)) {
      const { activateGogginsMode } = data;
       
       // Check message properties
       expect(activateGogginsMode.userEmail).toBe(variables.input.userEmail);
       expect(activateGogginsMode.explicitMode).toBe(variables.input.explicitMode);
       expect(activateGogginsMode.text).toBe('This is a mock AI response');
       expect(activateGogginsMode.modelUsed).toBe('gpt-3.5-turbo');
       
       // Check rate limit info
       expect(activateGogginsMode.rateLimitInfo.limit).toBe(2);
       expect(activateGogginsMode.rateLimitInfo.remaining).toBe(1);
       expect(new Date(activateGogginsMode.rateLimitInfo.resetTime).getTime()).toBeGreaterThan(Date.now());
     }
   }
});

it('should enforce daily rate limit after 2 requests for the same email', async () => {
  const variables = {
    input: {
      userEmail: 'limited@example.com',
      explicitMode: false,
    },
  };

  // Make 2 allowed requests
  await executeOperation(ACTIVATE_GOGGINS_MODE_MUTATION, variables, {});
  await executeOperation(ACTIVATE_GOGGINS_MODE_MUTATION, variables, {});

  // 3rd should be rate-limited
  const response = await executeOperation(ACTIVATE_GOGGINS_MODE_MUTATION, variables, {});

  expect(response.body.kind).toBe('single');
  if (response.body.kind === 'single') {
    const { errors } = response.body.singleResult;
    expect(errors).toBeDefined();
    expect(errors?.[0].message).toContain('Rate limit exceeded');
    expect(errors?.[0].extensions?.code).toBe('RATE_LIMITED');
    expect(errors?.[0].extensions).toEqual(expect.objectContaining({ limit: 2, remaining: 0 }));
    expect(new Date(errors?.[0].extensions?.resetTime as string).getTime()).toBeGreaterThan(Date.now());
    expect(errors?.[0].extensions).not.toHaveProperty('resetIn');
  }
});