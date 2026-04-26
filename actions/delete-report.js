"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath, unstable_cache } from "next/cache";

export async function deleteReport(logId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  if (!db.emailLog) {
    throw new Error("Email logging not available");
  }

  const log = await db.emailLog.findUnique({ where: { id: logId } });
  
  if (!log) throw new Error("Log not found");
  if (log.userId !== user.id) throw new Error("Unauthorized");

  await db.emailLog.delete({
    where: { id: logId },
  });

  revalidatePath("/reports");
  
  return { success: true };
}
