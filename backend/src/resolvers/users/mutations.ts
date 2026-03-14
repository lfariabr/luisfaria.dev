import User, { UserRole } from '../../models/User';
import { AUTH_COOKIE_BASE_OPTIONS, AUTH_COOKIE_MAX_AGE } from '../../utils/authUtils';
import { Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { rateLimiter } from '../../services/rateLimiter';
import { verifyTurnstileToken } from '../../services/turnstile';

export const userMutations = {
  // Register a new user
  register: async (_: any, { input }: any, context: any) => {
    const { name, email, password, captchaToken } = input;
    const normalizedEmail = email.trim().toLowerCase();
    const clientIp = context?.clientIp || 'unknown';

    const ipRateLimit = await rateLimiter.limit(`register:${clientIp}`, 5, 3600);
    if (!ipRateLimit.success) {
      throw Errors.badInput('Too many registration attempts. Please try again later.');
    }

    const emailRateLimit = await rateLimiter.limit(`register-email:${normalizedEmail}`, 3, 3600);
    if (!emailRateLimit.success) {
      throw Errors.badInput('Too many registration attempts. Please try again later.');
    }

    await verifyTurnstileToken(captchaToken, clientIp);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw Errors.badInput('Email already in use');
    }
    
    // Create new user
    const user = new User({
      name,
      email: normalizedEmail,
      password,
      role: UserRole.USER, // Use enum value
    });
    
    // Save the user
    await user.save();
    
    // Generate token
    const token = user.generateAuthToken();

    // Set secure httpOnly cookie with the token
    if (context?.res?.cookie) {
      context.res.cookie('token', token, {
        ...AUTH_COOKIE_BASE_OPTIONS,
        maxAge: AUTH_COOKIE_MAX_AGE,
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    return {
      token,
      user,
    };
  },
  
  // Login a user
  login: async (_: any, { input }: any, context: any) => {
    const { email, password } = input;
    
    // Find the user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw Errors.unauthenticated('Invalid email or password');
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw Errors.unauthenticated('Invalid email or password');
    }
    
    // Generate token
    const token = user.generateAuthToken();

    // Set secure httpOnly cookie with the token
    if (context?.res?.cookie) {
      context.res.cookie('token', token, {
        ...AUTH_COOKIE_BASE_OPTIONS,
        maxAge: AUTH_COOKIE_MAX_AGE,
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    return {
      token,
      user,
    };
  },
  
  // Logout - clear auth cookie
  logout: async (_: any, __: any, context: any) => {
    if (context?.res?.clearCookie) {
      context.res.clearCookie('token', {
        ...AUTH_COOKIE_BASE_OPTIONS
      });
    }
    return true;
  },

  /**
   * Update user role - handles both case formats for roles
   */
  updateUserRole: async (
    _: any,
    { id, role }: { id: string; role: string },
    context: any
  ) => {
    // Verify permissions
    if (!context.user || context.user.role !== UserRole.ADMIN) {
      throw Errors.forbidden('Not authorized to update user roles');
    }

    // Prevent admins from changing their own role
    if (context.user.id === id) {
      throw Errors.forbidden('Cannot change your own role');
    }

    // Normalize role to uppercase
    const normalizedRole = (role || '').toUpperCase() as UserRole;
    
    // Find user first (outside try so NotFound isn't swallowed)
    const targetUser = await User.findById(id);
    if (!targetUser) {
      throw Errors.notFound('User');
    }

    // Only wrap the save operation in try-catch for unexpected errors
    try {
      targetUser.role = normalizedRole;
      await targetUser.save();
      return targetUser;
    } catch (error) {
      logger.error('Error updating user role', { error, resolver: 'updateUserRole' });
      throw Errors.internal('Failed to update user role');
    }
  },
  
  // Delete user (admin only)
  deleteUser: async (_: any, { id }: { id: string }, context: any) => {
    // Check if user is authenticated and is an admin
    if (!context.user) {
      throw Errors.unauthenticated();
    }
    
    if (context.user.role !== UserRole.ADMIN) {
      throw Errors.forbidden('Not authorized to delete users');
    }
    
    // Prevent admins from deleting themselves
    if (context.user.id === id) {
      throw Errors.forbidden('Cannot delete your own account');
    }
    
    // Find and delete the user
    const result = await User.findByIdAndDelete(id);
    
    if (!result) {
      throw Errors.notFound('User');
    }
    
    return true;
  }
}
