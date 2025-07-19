"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function sendEmail({ to, subject, react }) {
  try {
    const data = await resend.emails.send({
      from: "QuantEdge <noreply@quantedge.ai>", // ✅ Use your verified domain here
      to,
      subject,
      react,
    });

    return { success: true, data };
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return {
      success: false,
      error: {
        message: error?.message || "Unknown error",
        code: error?.code || null,
        statusCode: error?.statusCode || 500,
      },
    };
  }
}

