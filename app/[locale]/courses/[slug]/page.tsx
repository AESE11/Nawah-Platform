import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrollmentRequestForm } from "@/components/enrollment/enrollment-request-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { getActiveEnrollmentForCourse } from "@/lib/services/enrollment-service";
import { getPaymentMethods } from "@/lib/services/payment-service";
import { formatCoursePrice } from "@/lib/currency";

export default async function CourseSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const dictionary = await getDictionary(safeLocale);

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      chapters: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!course || course.status !== "PUBLISHED") {
    notFound();
  }

  const session = await getAuthSession();
  const paymentMethods = await getPaymentMethods();
  const activeEnrollment = session?.user?.role === "STUDENT"
    ? await getActiveEnrollmentForCourse(session.user.id, course.id)
    : null;
  const latestEnrollmentRequest = session?.user?.role === "STUDENT" && !activeEnrollment
    ? await prisma.enrollmentRequest.findFirst({
        where: { userId: session.user.id, courseId: course.id },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const title = safeLocale === "ar" ? course.titleAr : course.titleEn;
  const shortDescription = safeLocale === "ar" ? course.shortDescriptionAr : course.shortDescriptionEn;
  const description = safeLocale === "ar" ? course.descriptionAr : course.descriptionEn;
  const features = safeLocale === "ar" ? course.featuresAr : course.featuresEn;
  const outcomes = safeLocale === "ar" ? course.outcomesAr : course.outcomesEn;
  const benefits = safeLocale === "ar" ? course.benefitsAr : course.benefitsEn;

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden p-0">
        {course.thumbnailUrl ? (
          <div className="relative h-72 w-full">
            <Image src={course.thumbnailUrl} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 75vw" />
          </div>
        ) : null}
        <div className="space-y-4 p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {course.category?.nameAr ?? course.category?.nameEn ?? "General"}
            </span>
            {course.featured ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                {safeLocale === "ar" ? "مميز" : "Featured"}
              </span>
            ) : null}
          </div>

          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          {shortDescription ? <p className="text-lg leading-8 text-slate-600">{shortDescription}</p> : null}
          {description ? <p className="whitespace-pre-wrap leading-7 text-slate-600">{description}</p> : null}
          <div className="flex items-center justify-between gap-3">
            <span className="text-2xl font-bold text-slate-900">{Number(course.price) > 0
  ? formatCoursePrice(course.price.toString(), safeLocale)
  : safeLocale === "ar"
    ? "مجانية"
    : "Free"}</span>
            <span className="text-sm text-slate-500">{safeLocale === "ar" ? "الحالة" : "Status"}: {course.status}</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: safeLocale === "ar" ? "ما يميز الدورة" : "What makes this course special",
            content: features,
          },
          {
            title: safeLocale === "ar" ? "مخرجات الدورة" : "What you will learn",
            content: outcomes,
          },
          {
            title: safeLocale === "ar" ? "فوائد الدورة" : "Course benefits",
            content: benefits,
          },
        ].map((section) => (
          <Card key={section.title} className="p-6">
            <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">
              {section.content || (safeLocale === "ar" ? "ستتم إضافة التفاصيل قريبًا." : "Details will be added soon.")}
            </p>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
  <div>
    <h2 className="text-2xl font-bold text-slate-900">
      {dictionary.common.courses}
    </h2>

    <p className="mt-2 text-sm font-medium text-slate-600">
      {safeLocale === "ar"
        ? `إجمالي عدد الدروس: ${course.chapters.reduce(
            (total, chapter) => total + chapter.lessons.length,
            0,
          )} درس`
        : `Total number of lessons: ${course.chapters.reduce(
            (total, chapter) => total + chapter.lessons.length,
            0,
          )} lessons`}
    </p>
  </div>

  {course.chapters.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
      {safeLocale === "ar"
        ? "لا توجد فصول في هذه الدورة."
        : "This course has no chapters yet."}
    </div>
  ) : null}

  {course.chapters.map((chapter, chapterIndex) => (
    <Card key={chapter.id} className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            {safeLocale === "ar" ? chapter.titleAr : chapter.titleEn}
          </h3>

          {activeEnrollment &&
          (safeLocale === "ar"
            ? chapter.descriptionAr
            : chapter.descriptionEn) ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {safeLocale === "ar"
                ? chapter.descriptionAr
                : chapter.descriptionEn}
            </p>
          ) : null}
        </div>

        <span className="text-sm text-slate-500">
          {safeLocale === "ar"
            ? `الفصل ${chapterIndex + 1}`
            : `Chapter ${chapterIndex + 1}`}
        </span>
      </div>

      {!activeEnrollment ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">
            {safeLocale === "ar"
              ? `عدد الدروس: ${chapter.lessons.length}`
              : `Number of lessons: ${chapter.lessons.length}`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chapter.lessons.length === 0 ? (
            <div className="text-sm text-slate-600">
              {safeLocale === "ar"
                ? "لا توجد دروس في هذا الفصل."
                : "No lessons in this chapter yet."}
            </div>
          ) : null}

          {chapter.lessons.map((lesson) => (
            <Link
              href={`/${safeLocale}/dashboard/courses/${course.id}?lessonId=${lesson.id}`}
              key={lesson.id}
              className="block"
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-medium text-slate-900">
                    {safeLocale === "ar"
                      ? lesson.titleAr
                      : lesson.titleEn}
                  </h4>

                  {lesson.duration ? (
                    <span className="text-xs text-slate-500">
                      {lesson.duration}s
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  {safeLocale === "ar"
                    ? lesson.descriptionAr || ""
                    : lesson.descriptionEn || ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  ))}
</div>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
              {safeLocale === "ar" ? "طريقة الاشتراك في الدورة" : "How to enroll"}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {safeLocale === "ar" ? "التسجيل اليدوي بعد التحقق من الدفع" : "Manual enrollment after payment verification"}
            </h2>
          </div>
          <span className="text-2xl font-bold text-slate-900">{Number(course.price) > 0
  ? formatCoursePrice(course.price.toString(), safeLocale)
  : safeLocale === "ar"
    ? "مجانية"
    : "Free"}</span>
        </div>

        <ol className="mt-6 list-decimal space-y-3 ps-6 leading-7 text-slate-700">
          {safeLocale === "ar" ? (
            <>
              <li>حوّل قيمة الدورة إلى رقم المحفظة الموضح في وسيلة الدفع المتاحة أدناه.</li>
              <li>احتفظ بصورة أو لقطة شاشة لإيصال التحويل.</li>
              <li>أرسل الإيصال عبر واتساب إلى رقم المحفظة نفسه عند توفر قناة التواصل.</li>
              <li>
                أرفق مع الإيصال: الاسم الرباعي، البريد الإلكتروني المستخدم في حساب الموقع، رقم المحفظة التي تم التحويل منها، رقم الهاتف الشخصي، اسم الدورة، وصورة إيصال التحويل.
              </li>
              <li>بعد مراجعة الدفع والتحقق منه، سيقوم المسؤول بتفعيل اشتراك الطالب.</li>
            </>
          ) : (
            <>
              <li>Transfer the course price to the wallet number shown in the available payment method below.</li>
              <li>Keep a screenshot or photo of the transfer receipt.</li>
              <li>Send the receipt through WhatsApp to the same wallet number when the contact channel is available.</li>
              <li>
                Include your full name, the email used for your website account, the wallet number used for the transfer, your personal phone number, the course name, and the transfer receipt.
              </li>
              <li>After the payment is reviewed and verified, the administrator will activate your enrollment.</li>
            </>
          )}
        </ol>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {paymentMethods.length > 0 ? paymentMethods.map((method) => (
            <div key={method.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">{safeLocale === "ar" ? method.nameAr : method.nameEn}</h3>
              {(safeLocale === "ar" ? method.instructionsAr : method.instructionsEn) ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {safeLocale === "ar" ? method.instructionsAr : method.instructionsEn}
                </p>
              ) : null}
              {(safeLocale === "ar" ? method.accountDetailsAr : method.accountDetailsEn) ? (
                <p className="mt-2 whitespace-pre-wrap font-medium leading-6 text-slate-800">
                  {safeLocale === "ar" ? method.accountDetailsAr : method.accountDetailsEn}
                </p>
              ) : null}
            </div>
          )) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {safeLocale === "ar"
                ? "سيتم عرض رقم المحفظة وتعليمات الدفع هنا بعد إعداد وسيلة دفع مفعلة من لوحة الإدارة."
                : "The wallet number and payment instructions will appear here after an enabled payment method is configured in the admin area."}
            </p>
          )}
        </div>

        <p className="mt-6 text-sm leading-6 text-slate-500">
          {safeLocale === "ar"
            ? "يجب أن يكون البريد الإلكتروني المرسل مع الإيصال هو نفسه البريد المستخدم في حساب الطالب بالموقع."
            : "The email submitted with the receipt must be the same email used for the student website account."}
        </p>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-xl font-bold text-slate-900">
            {safeLocale === "ar" ? "طلب الاشتراك في الدورة" : "Request enrollment"}
          </h3>
          {activeEnrollment ? (
            <p className="mt-3 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
              {safeLocale === "ar" ? "أنت مشترك بالفعل في هذه الدورة." : "You are already enrolled in this course."}
            </p>
          ) : latestEnrollmentRequest?.status === "PENDING" ? (
            <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              {safeLocale === "ar" ? "تم إرسال طلب الاشتراك بنجاح، وسيتم مراجعته من الإدارة. الحالة: قيد المراجعة" : "Your enrollment request was submitted successfully and will be reviewed by the administration. Status: Under review"}
            </p>
          ) : latestEnrollmentRequest?.status === "REJECTED" ? (
            <div className="mt-3 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">
              <p>{safeLocale === "ar" ? "تم رفض طلب الاشتراك." : "Your enrollment request was rejected."}</p>
              {latestEnrollmentRequest.adminNotes ? <p className="mt-2 whitespace-pre-wrap">{latestEnrollmentRequest.adminNotes}</p> : null}
            </div>
          ) : session?.user?.role === "STUDENT" ? (
            <EnrollmentRequestForm
              courseId={course.id}
              courseName={title}
              email={session.user.email ?? ""}
              locale={safeLocale}
            />
          ) : session?.user ? (
            <p className="mt-3 text-sm text-slate-600">
              {safeLocale === "ar" ? "يمكن للطلاب إرسال طلبات الاشتراك." : "Students can submit enrollment requests."}
            </p>
          ) : (
            <div className="mt-4">
              <p className="text-sm leading-6 text-slate-600">
                {safeLocale === "ar" ? "يرجى تسجيل الدخول لإرسال طلب الاشتراك." : "Please log in to submit an enrollment request."}
              </p>
              <Link href={`/${safeLocale}/login?callbackUrl=${encodeURIComponent(`/${safeLocale}/courses/${course.slug}`)}`} className="mt-4 inline-block">
                <Button type="button" className="min-h-11">
                  {safeLocale === "ar" ? "تسجيل الدخول والمتابعة" : "Log in to continue"}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
