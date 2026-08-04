import { Resend } from 'resend';
import { EmailProvider, SendEmailInput } from './email.provider';

// For local development or missing keys, we use a mock.
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_dummy_key_for_local_mocking';

const resend = new Resend(RESEND_API_KEY);

export class ResendEmailProvider implements EmailProvider {
  async send(input: SendEmailInput) {
    // If we are using a dummy key, just simulate the network request and return a mock ID.
    // In a real environment, this handles fallback to mailpit via custom SMTP.
    if (RESEND_API_KEY.includes('dummy')) {
      console.log(`[Mock Email] Sending to ${input.to} - Subject: ${input.subject}`);
      return {
        providerMessageId: `mock_${crypto.randomUUID()}`
      };
    }

    try {
      const sendPromise = resend.emails.send({
        from: 'Vamika Orders <orders@example.com>',
        to: [input.to],
        subject: input.subject,
        html: input.html,
      });

      // 5-second timeout enforced
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Email provider API timeout exceeded (5s)')), 5000);
      });

      const data = await Promise.race([sendPromise, timeoutPromise]);

      if (data.error) {
        throw new Error(data.error.message);
      }

      return {
        providerMessageId: data.data?.id || `unknown_${crypto.randomUUID()}`
      };
    } catch (error: any) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}
