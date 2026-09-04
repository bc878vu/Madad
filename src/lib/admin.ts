import { getCurrentUser } from '@/lib/auth';
export async function requireModerator(){const user=await getCurrentUser();if(!user||!['ADMIN','MODERATOR'].includes(user.role))return null;return user}