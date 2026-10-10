import { Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { checkAuth } from '../../utils/authUtils';
import { enforceRateLimit, Subject } from '../../rateLimiting';
import ChatMessage from '../../models/ChatMessage';
import { chatWithAI } from '../../services/openai';
import mongoose from 'mongoose';

export const chatbotMutations = {
  askQuestion: async (_: any, { question }: { question: string }, context: any) => {
    // Check authentication
    const user = checkAuth(context);
    
    const { limit, remaining, resetTime } = await enforceRateLimit('chatbot', Subject.user(user.id));
    const rateLimitInfo = { limit, remaining, resetTime: resetTime.toISOString() };
    
    try {
      // Get answer from AI
      const answer = await chatWithAI(question);
      
      // Save the chat message
      const chatMessage = new ChatMessage({
        userId: new mongoose.Types.ObjectId(user.id),
        question,
        answer,
        modelUsed: 'gpt-3.5-turbo',
      });
      
      await chatMessage.save();
      
      return {
        message: chatMessage,
        rateLimitInfo,
      };
    } catch (error: any) {
      logger.error('Chatbot error', { error: error.message, resolver: 'askQuestion' });
      throw Errors.internal('Failed to get response from AI service');
    }
  },
};