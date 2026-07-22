import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'placeholder@gmail.com',
    pass: process.env.EMAIL_PASS || 'placeholderpass',
  },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  const isDummyConfig = 
    !process.env.EMAIL_USER || 
    process.env.EMAIL_USER === 'example@gmail.com' || 
    process.env.EMAIL_USER.includes('placeholder');

  if (isDummyConfig) {
    console.log('\n==================================================');
    console.log(`[DEV MODE EMAIL LOGGER]`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`TEXT: ${text || 'See HTML content'}`);
    console.log(`HTML CONTENT:\n${html}`);
    console.log('==================================================\n');
    return { success: true, message: 'Dev mode: Email logged to console instead of sent.' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"AI Diabetes Assistant" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email via SMTP. Logging to console instead:', error.message);
    console.log('\n==================================================');
    console.log(`[SMTP FALLBACK EMAIL LOGGER]`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`HTML CONTENT:\n${html}`);
    console.log('==================================================\n');
    return { success: true, message: 'SMTP failed, fallback logged to console.' };
  }
};
