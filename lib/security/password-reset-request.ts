export const GENERIC_PASSWORD_RESET_RESPONSE = {
  status: 200,
  body: {
    message:
      "إذا كان البريد الإلكتروني مسجلًا لدينا، فستصلك رسالة تتضمن خطوات إعادة تعيين كلمة المرور.",
  },
  headers: { "Cache-Control": "no-store" },
};

export type PasswordResetRecipient = {
  id: string;
  email: string;
  passwordHash: string | null;
};

export type PasswordResetDeliveryTask = () => Promise<void>;

export function schedulePasswordResetDelivery(
  user: PasswordResetRecipient | null,
  schedule: (task: PasswordResetDeliveryTask) => void,
  deliver: (recipient: PasswordResetRecipient) => Promise<void>,
  onScheduleFailure: () => void = () => {},
): typeof GENERIC_PASSWORD_RESET_RESPONSE {
  if (user?.passwordHash) {
    try {
      schedule(() => deliver(user));
    } catch {
      onScheduleFailure();
    }
  }

  return GENERIC_PASSWORD_RESET_RESPONSE;
}
