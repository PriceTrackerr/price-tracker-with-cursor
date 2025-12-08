import express, { Request, Response } from 'express';
import EmailService from '../services/emailService';

const router = express.Router();
const emailService = new EmailService();

interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

/**
 * POST /api/contact
 * Handles contact form submissions and sends email to support
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, email, subject, message }: ContactFormData = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required fields'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Build email content
        const subjectMap: Record<string, string> = {
            support: 'Technical Support',
            sales: 'Sales & Pricing Inquiry',
            feature: 'Feature Request',
            other: 'General Inquiry'
        };

        const emailSubject = `[Contact Form] ${subjectMap[subject] || 'Message'} from ${name}`;

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📧 New Contact Form Submission</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151;">Name:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                ${name}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151;">Email:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <a href="mailto:${email}" style="color: #4F46E5;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151;">Subject:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                ${subjectMap[subject] || subject || 'Not specified'}
              </td>
            </tr>
          </table>
          
          <div style="margin-top: 24px;">
            <strong style="color: #374151;">Message:</strong>
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 8px; color: #374151; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
            Sent via Price Tracker Contact Form • ${new Date().toLocaleString()}
          </div>
        </div>
      </div>
    `;

        // Send email to support
        const targetEmail = process.env.CONTACT_EMAIL || 'realpricetracker94@gmail.com';

        const emailSent = await emailService.sendEmail({
            to: targetEmail,
            subject: emailSubject,
            html: htmlContent
        });

        if (emailSent) {
            console.log(`📧 Contact form email sent from ${name} (${email})`);
            return res.status(200).json({
                success: true,
                message: 'Your message has been sent successfully. We\'ll get back to you soon!'
            });
        } else {
            // Fallback: Log to console if email sending fails
            console.log('📧 [CONTACT FORM - Email sending failed, logging instead]');
            console.log('From:', name, `<${email}>`);
            console.log('Subject:', emailSubject);
            console.log('Message:', message);

            // Still return success to user (since we logged it)
            return res.status(200).json({
                success: true,
                message: 'Your message has been received. We\'ll get back to you soon!'
            });
        }
    } catch (error) {
        console.error('Error processing contact form:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while sending your message. Please try again later.'
        });
    }
});

export default router;
