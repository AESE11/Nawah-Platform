
import { Resend } from "resend";

type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: PasswordResetEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Password reset email is not configured.");
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to,
    subject: "إعادة تعيين كلمة المرور - نواة",
    html: `
      <div dir="rtl" lang="ar" style="font-family:Arial,sans-serif;line-height:1.8">
        <h2>إعادة تعيين كلمة المرور</h2>
        <p>تلقينا طلبًا لإعادة تعيين كلمة المرور لحسابك في نواة.</p>
        <p>اضغط على الرابط التالي لإكمال العملية. الرابط صالح لمدة 30 دقيقة ويُستخدم مرة واحدة.</p>
        <p><a href="${escapeHtml(resetUrl)}">إعادة تعيين كلمة المرور</a></p>
        <p>إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error("Password reset email could not be sent.");
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}
