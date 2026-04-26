"use server";

import { Resend } from "resend";
import { db } from "@/lib/prisma";

export async function sendEmail({
  to,
  subject,
  react,
  userId,
  type = "OTHER",
}) {
  if (!process.env.RESEND_API_KEY) {
    return {
      success: false,
      error: { message: "RESEND_API_KEY is not configured" },
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY || "");

  try {
    const { data, error } = await resend.emails.send({
      from: "Finsight app <onboarding@resend.dev>",
      to,
      subject,
      react,
    });

    if (error) {
      console.error("Resend API error:", error);
      if (db.emailLog) {
        await db.emailLog.create({
          data: {
            userId: userId || null,
            email: to,
            subject,
            type,
            status: "FAILED",
            errorMessage: error.message || "Email provider error",
          },
        });
      }

      return {
        success: false,
        error: { message: error.message || "Failed to send email" },
      };
    }

    if (db.emailLog) {
      await db.emailLog.create({
        data: {
          userId: userId || null,
          email: to,
          subject,
          type,
          status: "SENT",
          providerMessageId: data?.id || null,
        },
      });
    }

    return {
      success: true,
      data: {
        id: data?.id || null,
      },
    };
  } catch (err) {
    console.error("Failed to send email (exception):", err);

    const message = err?.message || "Unknown email send error";

    if (db.emailLog) {
      await db.emailLog.create({
        data: {
          userId: userId || null,
          email: to,
          subject,
          type,
          status: "FAILED",
          errorMessage: message,
        },
      });
    }

    return {
      success: false,
      error: { message },
    };
  }
}
