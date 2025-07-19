"use server";

import { Resend } from "resend";

// Initialize Resend instance using your API key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ subject, react }) {
  try {
    const data = await resend.emails.send({
      from: "QuantEdge <onboarding@resend.dev>",   // ✅ Free tier sender
      to: "iaman.singh011@gmail.com",               // ✅ Your verified email
      subject: subject,
      react: react,                                 // ✅ JSX Component like <ReportEmail />
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
