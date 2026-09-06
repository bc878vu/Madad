import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Response } from "express";
import { and, count, desc, eq, gte, inArray, ne } from "drizzle-orm";
import {
  AddCommentBody,
  AddCommentParams,
  CreatePostBody,
  ListPostsQueryParams,
  LoginUserBody,
  OfferHelpBody,
  OfferHelpParams,
  RegisterUserBody,
  ReportPostBody,
  ReportPostParams,
} from "@workspace/api-zod";
import { comments, db, helpOffers, posts, reports, users } from "@workspace/db";
import {
  clearSessionCookie,
  createSession,
  getCurrentUser,
  hashPassword,
  isUniqueViolation,
  publicUser,
  revokeCurrentSession,
  setSessionCookie,
  verifyPassword,
} from "../lib/madad-auth";
import { checkRateLimit } from "../lib/rate-limit";

const router: IRouter = Router();

function sendError(res: Response, status: number, error: string) {
  return res.status(status).json({ error });
}

function postShape(
  post: typeof posts.$inferSelect,
  username: string,
  commentCount: number,
  helpCount: number,
) {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    category: post.category,
    country: post.country,
    city: post.city,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    author: { username },
    _count: { comments: commentCount, helpOffers: helpCount },
  };
}

async function listPostShapes(category?: string, limit = 30) {
  const filters = [eq(posts.status, "ACTIVE")];
  if (category && category !== "All") filters.push(eq(posts.category, category));
  const rows = await db
    .select({ post: posts, username: users.username })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(...filters))
    .orderBy(desc(posts.createdAt))
    .limit(limit);
  const ids = rows.map((row) => row.post.id);
  if (ids.length === 0) return [];
  const [commentCounts, helpCounts] = await Promise.all([
    db
      .select({ postId: comments.postId, total: count() })
      .from(comments)
      .where(inArray(comments.postId, ids))
      .groupBy(comments.postId),
    db
      .select({ postId: helpOffers.postId, total: count() })
      .from(helpOffers)
      .where(inArray(helpOffers.postId, ids))
      .groupBy(helpOffers.postId),
  ]);
  const commentMap = new Map(commentCounts.map((item) => [item.postId, Number(item.total)]));
  const helpMap = new Map(helpCounts.map((item) => [item.postId, Number(item.total)]));
  return rows.map((row) =>
    postShape(row.post, row.username, commentMap.get(row.post.id) ?? 0, helpMap.get(row.post.id) ?? 0),
  );
}

router.get("/auth/me", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    return res.json({ user: user ? publicUser(user) : null });
  } catch (error) {
    req.log.error({ err: error }, "Unable to load current user");
    return sendError(res, 500, "Unable to load your session.");
  }
});

router.post("/auth/register", async (req, res) => {
  try {
    const parsed = RegisterUserBody.parse({
      ...req.body,
      displayName: req.body?.displayName || req.body?.username,
    });
    const email = parsed.email.toLowerCase();
    if (!checkRateLimit(`register:${email}`, 3, 60 * 60 * 1000).allowed) {
      return sendError(res, 429, "Too many registration attempts. Please try again later.");
    }
    const user = {
      id: randomUUID(),
      email,
      username: parsed.username.trim().toLowerCase(),
      displayName: parsed.displayName?.trim() || parsed.username.trim(),
      passwordHash: hashPassword(parsed.password),
      role: "USER",
      emailVerified: false,
      isRestricted: false,
    };
    const inserted = await db.insert(users).values(user).returning();
    const created = inserted[0];
    if (!created) return sendError(res, 500, "Unable to create your account.");
    const token = await createSession(created.id);
    setSessionCookie(res, token);
    return res.status(201).json({ user: publicUser(created), verificationRequired: true });
  } catch (error) {
    if (isUniqueViolation(error)) return sendError(res, 409, "Email or username is already in use.");
    if (error instanceof Error && error.name === "ZodError") {
      return sendError(res, 400, "Please check your registration details.");
    }
    req.log.error({ err: error }, "Registration failed");
    return sendError(res, 500, "Unable to create your account right now.");
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const parsed = LoginUserBody.parse(req.body);
    const result = await db.select().from(users).where(eq(users.email, parsed.email.toLowerCase())).limit(1);
    const user = result[0];
    if (!user || !verifyPassword(parsed.password, user.passwordHash)) {
      return sendError(res, 401, "Invalid email or password.");
    }
    if (user.isRestricted) return sendError(res, 403, "This account is currently restricted.");
    const token = await createSession(user.id);
    setSessionCookie(res, token);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, 400, "Invalid login request.");
    req.log.error({ err: error }, "Login failed");
    return sendError(res, 500, "Unable to sign you in right now.");
  }
});

router.post("/auth/logout", async (req, res) => {
  try {
    await revokeCurrentSession(req);
    clearSessionCookie(res);
    return res.json({ ok: true });
  } catch (error) {
    req.log.error({ err: error }, "Logout failed");
    return sendError(res, 500, "Unable to sign you out right now.");
  }
});

router.get("/posts", async (req, res) => {
  try {
    const query = ListPostsQueryParams.parse(req.query);
    return res.json({ posts: await listPostShapes(query.category, query.limit) });
  } catch (error) {
    req.log.error({ err: error }, "Unable to list posts");
    return sendError(res, 500, "Unable to load community requests.");
  }
});

router.post("/posts", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return sendError(res, 401, "Authentication required.");
    if (user.isRestricted) return sendError(res, 403, "Account is restricted.");
    if (!checkRateLimit(`post:${user.id}`, 5, 60 * 60 * 1000).allowed) {
      return sendError(res, 429, "Posting limit reached. Please try again later.");
    }
    const parsed = CreatePostBody.parse(req.body);
    const duplicateSince = new Date(Date.now() - 10 * 60 * 1000);
    const duplicate = await db
      .select({ id: posts.id })
      .from(posts)
      .where(
        and(
          eq(posts.authorId, user.id),
          eq(posts.title, parsed.title),
          eq(posts.content, parsed.content),
          gte(posts.createdAt, duplicateSince),
          ne(posts.status, "REMOVED"),
        ),
      )
      .limit(1);
    if (duplicate[0]) return sendError(res, 409, "Duplicate post detected.");
    const inserted = await db
      .insert(posts)
      .values({
        id: randomUUID(),
        authorId: user.id,
        title: parsed.title.trim(),
        content: parsed.content.trim(),
        category: parsed.category.trim(),
        country: parsed.country?.trim() || null,
        city: parsed.city?.trim() || null,
      })
      .returning();
    const created = inserted[0];
    if (!created) return sendError(res, 500, "Unable to publish your request.");
    return res.status(201).json({ post: postShape(created, user.username, 0, 0) });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, 400, "Invalid post data.");
    req.log.error({ err: error }, "Unable to create post");
    return sendError(res, 500, "Unable to publish your request right now.");
  }
});

router.post("/posts/:postId/help", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return sendError(res, 401, "Authentication required.");
    const { postId } = OfferHelpParams.parse(req.params);
    const body = OfferHelpBody.parse(req.body ?? {});
    const existingPost = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
    if (!existingPost[0]) return sendError(res, 404, "Request not found.");
    const existingOffer = await db
      .select({ id: helpOffers.id })
      .from(helpOffers)
      .where(and(eq(helpOffers.postId, postId), eq(helpOffers.userId, user.id)))
      .limit(1);
    if (existingOffer[0]) return sendError(res, 409, "You have already offered help on this request.");
    await db.insert(helpOffers).values({
      id: randomUUID(),
      postId,
      userId: user.id,
      message: body.message?.trim() || null,
    });
    return res.status(201).json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, 400, "Invalid help offer.");
    req.log.error({ err: error }, "Unable to create help offer");
    return sendError(res, 500, "Unable to send your offer right now.");
  }
});

router.post("/posts/:postId/comments", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return sendError(res, 401, "Authentication required.");
    const { postId } = AddCommentParams.parse(req.params);
    const body = AddCommentBody.parse(req.body);
    const existingPost = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
    if (!existingPost[0]) return sendError(res, 404, "Request not found.");
    await db.insert(comments).values({
      id: randomUUID(),
      postId,
      authorId: user.id,
      content: body.content.trim(),
    });
    return res.status(201).json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, 400, "Please write a helpful comment.");
    req.log.error({ err: error }, "Unable to create comment");
    return sendError(res, 500, "Unable to add your comment right now.");
  }
});

router.post("/posts/:postId/report", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return sendError(res, 401, "Authentication required.");
    const { postId } = ReportPostParams.parse(req.params);
    const body = ReportPostBody.parse(req.body);
    const existingPost = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
    if (!existingPost[0]) return sendError(res, 404, "Request not found.");
    await db.insert(reports).values({
      id: randomUUID(),
      postId,
      reporterId: user.id,
      reason: body.reason.trim(),
      details: body.details?.trim() || null,
    });
    return res.status(201).json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, 400, "Please describe the concern.");
    req.log.error({ err: error }, "Unable to create report");
    return sendError(res, 500, "Unable to submit the report right now.");
  }
});

export default router;