import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

import { applications as applicationsTable } from "@job-applications-app/core/db/schema/applications";
import { db } from "@job-applications-app/core/db";
import { eq, desc, count, and } from "drizzle-orm";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

import { authMiddleware } from "@job-applications-app/core/auth";

const app = new Hono();

app.get("/applications/total-applications", authMiddleware, async (c) => {
  const userId = c.var.userId;

  console.log(userId);
  const result = await db
    .select({ total: count() })
    .from(applicationsTable)
    .where(eq(applicationsTable.userId, userId))
    .then((res) => res[0]);
  return c.json(result);
});

app.get("/applications", authMiddleware, async (c) => {
  const userId = c.var.userId;
  const applications = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.userId, userId))
    .orderBy(desc(applicationsTable.createdAt));
  return c.json({ applications });
});

app.post("/applications", authMiddleware, async (c) => {
  const userId = c.var.userId;
  const body = await c.req.json();
  const application = {
    ...body.application,
    userId,
  };
  const newApplication = await db
    .insert(applicationsTable)
    .values(application)
    .returning();
  return c.json({ applications: newApplication });
});

const s3 = new S3Client({});

app.delete("/applications/:id", authMiddleware, async (c) => {
  const userId = c.var.userId;
  const id = +c.req.param("id");

  const application = await db
    .select()
    .from(applicationsTable)
    .where(
      and(eq(applicationsTable.userId, userId), eq(applicationsTable.id, id))
    )
    .then((res) => res[0]);

  if (!application) {
    return c.json({ error: "Application not found" }, 404);
  }

  if (application.userId !== userId) {
    return c.json(
      { error: "You don't have permission to delete the job application" },
      403
    );
  }

  const deletedApplication = await db
    .delete(applicationsTable)
    .where(
      and(eq(applicationsTable.userId, userId), eq(applicationsTable.id, id))
    )
    .returning()
    .then((res) => res[0]);

  if (!deletedApplication) {
    return c.json({ error: "Application not found" }, 404);
  }

  const deleteCommand = new DeleteObjectCommand({
    Bucket: process.env.ASSETS_BUCKET_NAME!,
    Key: deletedApplication.imageUrl.split("/").pop()!,
  });

  await s3.send(deleteCommand);

  return c.json({ success: true });
});

export const handler = handle(app);
