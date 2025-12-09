import { Request } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { UserRole } from '../models/User';

// Interface for JWT payload
interface JWTPayload {
    id: string;
    email: string;
    role: string;
}

// Get auth user from the token (cookie-based auth)
export const getUser = (req: Request): JWTPayload | null => {
    // Get token directly from httpOnly cookie
    const token = req.cookies?.token;
    
    if (!token) {
        return null;
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
        
        // Normalize role to uppercase for compatibility with both old and new tokens
        if (decoded.role) {
            // Convert legacy lowercase roles to the new uppercase format
            switch(decoded.role.toLowerCase()) {
                case 'ADMIN':
                    decoded.role = UserRole.ADMIN;
                    break;
                case 'EDITOR':
                    decoded.role = UserRole.EDITOR;
                    break;
                case 'USER':
                    decoded.role = UserRole.USER;
                    break;
            }
        }
        
        return decoded;
    } catch (error) {
        return null;
    }
};

// Middleware to protect routes
export const requireAuth = (role: string = UserRole.USER) => {
    return (req: Request, res: any, next: any) => {
        const user = getUser(req);

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check if the user has the required role, with special handling for ADMIN
        if (role && user.role !== role && user.role !== UserRole.ADMIN) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        next();
    };
};
