import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request:Request){
  try{
    const raw=await request.json();
    const body=registerSchema.parse({...raw,displayName:raw.displayName||raw.username});
    const email=body.email.toLowerCase();
    const limit=checkRateLimit(`register:${email}`,3,60*60*1000);
    if(!limit.allowed)return NextResponse.json({error:'Too many registration attempts. Please try again later.'},{status:429});
    const existing=await prisma.user.findFirst({where:{OR:[{email},{username:body.username}]}});
    if(existing)return NextResponse.json({error:'Email or username is already in use.'},{status:409});
    const user=await prisma.user.create({data:{email,username:body.username,displayName:body.displayName,passwordHash:hashPassword(body.password),emailVerified:false}});
    const token=await createSession(user.id);
    const response=NextResponse.json({user:{id:user.id,username:user.username,email:user.email,displayName:user.displayName,emailVerified:user.emailVerified,role:user.role},verificationRequired:true},{status:201});
    response.cookies.set(SESSION_COOKIE,token,sessionCookieOptions());
    return response;
  }catch(error){
    if(error instanceof ZodError)return NextResponse.json({error:error.issues[0]?.message||'Please check the registration details.'},{status:400});
    console.error('Registration error',error);
    return NextResponse.json({error:'Unable to create your account right now. Please try again.'},{status:500});
  }
}
