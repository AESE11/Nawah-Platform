"use client";

import Link from "next/link";
import { useState } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [english, setEnglish] = useState(false);

  const t = english
    ? {
        title: "Reset your password",
        description: "Enter your new password below.",
        password: "New password",
        confirm: "Confirm new password",
        submit: "Save new password",
        loading: "Saving...",
        mismatch: "Passwords do not match.",
        short: "Password must be at least 8 characters.",
        missing: "The reset link is missing its token. Request a new link.",
        invalid: "This link is invalid or has expired. Request a new one.",
        failed: "Could not reset your password. Please try again.",
        done: "Your password has been changed successfully. You can now log in.",
        login: "Go to login",
        language: "العربية",
      }
    : {
        title: "إعادة تعيين كلمة المرور",
        description: "أدخل كلمة المرور الجديدة.",
        password: "كلمة المرور الجديدة",
        confirm: "تأكيد كلمة المرور الجديدة",
        submit: "حفظ كلمة المرور الجديدة",
        loading: "جارٍ الحفظ...",
        mismatch: "كلمتا المرور غير متطابقتين.",
        short: "يجب ألا تقل كلمة المرور عن 8 أحرف.",
        missing: "رابط إعادة التعيين لا يحتوي على الرمز المطلوب. اطلب رابطًا جديدًا.",
        invalid: "الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.",
        failed: "تعذر تغيير كلمة المرور. حاول مرة أخرى.",
        done: "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.",
        login: "الانتقال إلى تسجيل الدخول",
        language: "English",
      };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!token) {
      setMessage(t.missing);
      return;
    }

    if (password.length < 8) {
      setMessage(t.short);
      return;
    }

    if (password !== confirmPassword) {
      setMessage(t.mismatch);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/mobile/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!response.ok) {
        setMessage(response.status === 400 ? t.invalid : t.failed);
        return;
      }

      setSuccess(true);
      setMessage(t.done);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setMessage(t.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir={english ? "ltr" : "rtl"}
      className="flex min-h-[70vh] items-center justify-center px-4 py-12"
    >
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
            <p className="mt-2 text-sm text-slate-600">{t.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setEnglish((value) => !value)}
            className="shrink-0 text-sm text-blue-700 underline"
          >
            {t.language}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-slate-700">
              {t.password}
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-slate-700">
              {t.confirm}
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {message && (
            <p
              role="status"
              className={`text-sm ${success ? "text-green-700" : "text-red-600"}`}
            >
              {message}
            </p>
          )}

          {success ? (
            <Link
              href="/ar/login"
              className="block w-full rounded-xl bg-blue-700 px-4 py-3 text-center font-semibold text-white hover:bg-blue-800"
            >
              {t.login}
            </Link>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t.loading : t.submit}
            </button>
          )}
        </form>
      </section>
    </main>
  );
}
