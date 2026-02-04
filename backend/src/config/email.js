import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// Initialize Resend only if API key is provided
let resend = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("Email service (Resend) initialized");
} else {
  console.warn("RESEND_API_KEY not set - email features will be disabled");
}

/**
 * Send email verification link to new users
 */
export const sendVerificationEmail = async (email, username, verificationToken) => {
  // Skip if email service not configured
  if (!resend) {
    console.warn(" Email service not configured - skipping verification email");
    console.log(`[DEV] Verification link for ${email}: ${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`);
    return { skipped: true };
  }

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: email,
      subject: "Welcome to ChatWave - Verify Your Email",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🌊 ChatWave</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${username}! 👋</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thanks for joining ChatWave! To start chatting with your friends, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #10b981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #10b981; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
              This link will expire in 24 hours.<br>
              If you didn't create this account, please ignore this email.<br>
              Need help? Contact us at support@chatwave.com
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend verification email error:', error);
      throw new Error('Failed to send verification email');
    }

    console.log('Verification email sent successfully:', data);
  } catch (error) {
    console.error('Verification email sending failed:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const resetPasswordEmail = async (email, resetToken) => {
  // Skip if email service not configured
  if (!resend) {
    console.warn("Email service not configured - skipping reset email");
    console.log(`[DEV] Reset link for ${email}: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);
    return { skipped: true };
  }

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: email,
      subject: "ChatWave Password Reset",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🌿 ChatWave</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              You requested to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #10b981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Or copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #10b981; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
              This link will expire in 1 hour.<br>
              If you didn't request this, please ignore this email.<br>
              Need help? Take a screenshot and send it to us at <span font-style="bold"> Chatwave.gmail.com </span>
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new Error('Failed to send email');
    }

    console.log('Email sent successfully:', data);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error; 
  }
};
