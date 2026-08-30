import { NextResponse } from "next/server";
import { GENDERS, MAX_RECEIPT_BYTES } from "@/lib/constants/auth";
import { loadPurchasablePrices } from "@/lib/magster/catalog-prices";
import { submitMagsterPaymentRequest } from "@/lib/magster/checkout";
import { loadActivePaymentMethods } from "@/lib/magster/payment-methods";
import { uploadPaymentReceipt } from "@/lib/magster/receipts";
import {
  loadRegistrationCatalog,
  isPhoneTakenForNewRegistration,
  registerMagsterStudent,
  resolveDefaultStream,
} from "@/lib/magster/registration";
import { MINI_APP_DEFAULT_PIN, MINI_APP_TERMS_ACCEPTED } from "@/lib/server/registration-defaults";
import { readAppSession, writeAppSession } from "@/lib/session/app-session";
import { attachTelegramToStudent } from "@/lib/magster/telegram-link";
import {
  hasErrors,
  validateProfile,
  validationMessages,
  type ProfileFields,
} from "@/lib/validation/registration";

export const runtime = "nodejs";

function parseIdList(raw: FormDataEntryValue | null): number[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map((value) => Number(value)).filter((id) => Number.isFinite(id) && id > 0))];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json(
        { ok: false, message: "Please submit a valid registration form." },
        { status: 400 },
      );
    }
    const profile: ProfileFields = {
      fullName: String(form.get("fullName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      gender: String(form.get("gender") ?? ""),
      academicYear: String(form.get("academicYear") ?? ""),
      institution: String(form.get("institution") ?? ""),
    };
    const errors = validateProfile(profile);
    if (hasErrors(errors)) {
      return NextResponse.json(
        { ok: false, message: "Please correct the highlighted fields.", errors },
        { status: 400 },
      );
    }
    if (!GENDERS.includes(profile.gender as (typeof GENDERS)[number])) {
      return NextResponse.json({ ok: false, message: "Please select your gender." }, { status: 400 });
    }

    const catalog = await loadRegistrationCatalog();
    if (!catalog.academicYears.some((item) => item.name === profile.academicYear)) {
      return NextResponse.json({ ok: false, message: "Please select a valid academic year." }, { status: 400 });
    }
    if (!catalog.institutions.some((item) => item.name === profile.institution)) {
      return NextResponse.json({ ok: false, message: "Please select a valid institution." }, { status: 400 });
    }

    const courseIds = parseIdList(form.get("courseIds"));
    const bundleIds = parseIdList(form.get("bundleIds"));
    const prices = await loadPurchasablePrices({ courseIds, bundleIds });

    const paymentSlug = String(form.get("paymentMethod") ?? "").trim();
    const methods = await loadActivePaymentMethods();
    const method = methods.find((item) => item.slug === paymentSlug);
    if (!method) {
      return NextResponse.json({ ok: false, message: "Please select a payment method." }, { status: 400 });
    }

    const termsAccepted = String(form.get("termsAccepted") ?? "") === "true";
    if (!termsAccepted) {
      return NextResponse.json(
        { ok: false, message: "Please accept Magster terms and policies." },
        { status: 400 },
      );
    }

    const receipt = form.get("receipt");
    if (!(receipt instanceof File) || receipt.size <= 0) {
      return NextResponse.json({ ok: false, message: "Please upload a payment receipt." }, { status: 400 });
    }
    if (receipt.size > MAX_RECEIPT_BYTES) {
      return NextResponse.json(
        { ok: false, message: "The selected image exceeds the maximum size of 3 MB." },
        { status: 400 },
      );
    }

    const session = await readAppSession();
    if (!session.studentId) {
      const phoneTaken = await isPhoneTakenForNewRegistration(profile.phone, null);
      if (phoneTaken) {
        return NextResponse.json(
          { ok: false, code: "phone_registered", message: validationMessages.phoneTaken },
          { status: 409 },
        );
      }
    }
    let studentId = session.studentId;
    if (!studentId) {
      const registered = await registerMagsterStudent({
        fullName: profile.fullName,
        phone: profile.phone,
        gender: profile.gender,
        academicYear: profile.academicYear,
        institution: profile.institution,
        stream: resolveDefaultStream(catalog),
        pin: MINI_APP_DEFAULT_PIN,
        deviceId: session.deviceId,
        termsAccepted: MINI_APP_TERMS_ACCEPTED,
      });
      if (!registered.ok) {
        return NextResponse.json(
          { ok: false, code: registered.code, message: registered.message },
          { status: registered.code === "phone_registered" ? 409 : 400 },
        );
      }
      studentId = registered.studentId;
      await writeAppSession({
        ...session,
        studentId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      });
    }

    // Associate the verified Telegram identity with the student. This covers both
    // brand-new students (just registered above) and existing students whose
    // signed app session already identified them. It never creates a duplicate
    // account — it only updates the identified student's telegram_* columns.
    // A Telegram link failing must not block the payment submission.
    try {
      await attachTelegramToStudent(studentId, session.deviceId);
    } catch (linkError) {
      console.warn("Telegram link skipped (non-fatal):", linkError);
    }

    const bytes = Buffer.from(await receipt.arrayBuffer());
    const receiptUrl = await uploadPaymentReceipt({
      studentId,
      bytes,
      contentType: receipt.type || "image/jpeg",
    });

    for (const courseId of prices.courseIds) {
      await submitMagsterPaymentRequest({
        studentId,
        paymentMethod: method.slug,
        receiptUrl,
        courseId,
      });
    }
    for (const bundleId of prices.bundleIds) {
      await submitMagsterPaymentRequest({
        studentId,
        paymentMethod: method.slug,
        receiptUrl,
        bundleId,
      });
    }

    return NextResponse.json({
      ok: true,
      studentId,
      total: prices.total,
      paymentMethod: method.name,
      requestCount: prices.courseIds.length + prices.bundleIds.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit registration.";
    const clientError =
      /please select|no longer available|cannot be purchased|jpg|png|3 mb|invalid/i.test(
        message,
      );
    return NextResponse.json({ ok: false, message }, { status: clientError ? 400 : 500 });
  }
}
