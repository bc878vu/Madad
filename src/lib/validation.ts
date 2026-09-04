import { z } from 'zod';

export const signupSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128)
    .regex(/[a-z]/, 'Password needs a lowercase letter')
    .regex(/[A-Z]/, 'Password needs an uppercase letter')
    .regex(/[0-9]/, 'Password needs a number'),
});

export const registerSchema = signupSchema;

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const postSchema = z.object({
  title: z.string().trim().min(5).max(160),
  content: z.string().trim().min(10).max(5000),
  category: z.string().trim().min(2).max(60),
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(100).optional(),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});