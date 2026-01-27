import User, { UserRole } from '../../models/User';
import { Errors } from '../../utils/errors';

export const userQueries = {
    // Get all users (admin only)
    users: async (_: any, __: any, context: any) => {
        // Check if user is authenticated and is an admin
        if (!context.user) {
            throw Errors.unauthenticated();
        }
        
        // Only admins can view all users
        if (context.user.role !== UserRole.ADMIN) {
            throw Errors.forbidden('Not authorized to view all users');
        }
        
        // Return all users
        return await User.find({}).sort({ createdAt: -1 });
    },    
    // Get a single user by ID (admin only)
    user: async (_: any, { id }: { id: string }, context: any) => {
        // Check if user is authenticated and is an admin
        if (!context.user) {
            throw Errors.unauthenticated();
        }
        
        // Only admins or the user themselves can view user details
        if (context.user.role !== UserRole.ADMIN && context.user.id !== id) {
            throw Errors.forbidden('Not authorized to view this user');
        }
        
        // Return the user
        return await User.findById(id);
    },
    // Get the current auth user
    me: async (_: any, __: any, context: any) => {
        // Check if user is authenticated
        if (!context.user) {
            throw Errors.unauthenticated();
        }
        // Return user from database
        return await User.findById(context.user.id);
    },
};