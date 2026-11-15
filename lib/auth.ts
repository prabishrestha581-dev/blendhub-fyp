import { betterAuth } from "better-auth";
import nodemailer from "nodemailer";
import { after } from "next/server";
import { db } from "./db";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const auth = betterAuth({
  database: db,
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,

    sendResetPassword: async ({ user, url }) => {
      after(async () => {
        try {
          await transporter.sendMail({
            from: {
              name: "BlendHub",
              address: process.env.GMAIL_USER!,
            },
            to: user.email,
            subject: "Reset your BlendHub password",
            text: [
              "You requested a password reset for BlendHub.",
              "",
              `Set your new password here: ${url}`,
              "",
              "If you did not request this, ignore this email.",
            ].join("\n"),
          });
        } catch {
          console.error("Gmail password reset email could not be sent.");
        }
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});