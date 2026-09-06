import { cookies } from 'next/headers';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
const SESSION_COOKIE = 'madad_session';
const SESSION_TTL = 60 * 60 * 24 * 7;
export function hashPassword(password:string){const salt=randomBytes(16).toString('hex');return `${salt}:${scryptSync(password,salt,64).toString('hex')}`}
export function verifyPassword(password:string,stored:string){const [salt,hash]=stored.split(':');if(!salt||!hash)return false;const derived=scryptSync(password,salt,64);const saved=Buffer.from(hash,'hex');return derived.length===saved.length&&timingSafeEqual(derived,saved)}
export function createSessionToken(){return randomBytes(32).toString('hex')}
function hashToken(token:string){return createHash('sha256').update(token).digest('hex')}
export async function createSession(userId:string){const token=createSessionToken();await prisma.session.create({data:{tokenHash:hashToken(token),userId,expiresAt:new Date(Date.now()+SESSION_TTL*1000)}});return token}
export async function getCurrentUser(){const token=(await cookies()).get(SESSION_COOKIE)?.value;if(!token)return null;const session=await prisma.session.findUnique({where:{tokenHash:hashToken(token)},include:{user:true}});if(!session||session.expiresAt<=new Date()){if(session)await prisma.session.delete({where:{id:session.id}});return null}return session.user}
export async function revokeCurrentSession(){const token=(await cookies()).get(SESSION_COOKIE)?.value;if(token)await prisma.session.deleteMany({where:{tokenHash:hashToken(token)}})}
export function sessionCookieOptions(){return {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:SESSION_TTL}}
export { SESSION_COOKIE };