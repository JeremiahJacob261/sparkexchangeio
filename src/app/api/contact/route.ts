import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "sparkexchangedex@gmail.com";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, subject, message } = body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Send email using Resend
        const { data, error } = await resend.emails.send({
            from: "Spark Exchange <noreply@contact.sparkexchange.io>",
            to: [SUPPORT_EMAIL],
            replyTo: email,
            subject: `[Contact Form] ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f59e0b;">New Contact Form Submission</h2>
                    <hr style="border: 1px solid #e5e7eb;" />
                    <p><strong>From:</strong> ${name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <hr style="border: 1px solid #e5e7eb;" />
                    <h3>Message:</h3>
                    <p style="white-space: pre-wrap; background: #f3f4f6; padding: 16px; border-radius: 8px;">${message}</p>
                    <hr style="border: 1px solid #e5e7eb;" />
                    <p style="color: #6b7280; font-size: 12px;">
                        This message was sent from the Spark Exchange contact form.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json(
                { error: "Failed to send email" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, messageId: data?.id },
            { status: 200 }
        );
    } catch (error) {
        console.error("Contact form error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
