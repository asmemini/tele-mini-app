"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTelegramIdentity } from "@/components/telegram/telegram-provider";
import { OptionPicker } from "@/components/ui/option-picker";
import { PhoneField } from "@/components/ui/phone-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextField } from "@/components/ui/text-field";
import { WizardHeader } from "@/components/wizard/wizard-progress";
import type { BootstrapPayload } from "@/lib/bootstrap/types";
import { GENDERS, MAX_RECEIPT_BYTES } from "@/lib/constants/auth";
import { formatEtb } from "@/lib/format/etb";
import {
  bundleOriginalTotal,
  formatSelectionTotal,
  isPurchasableBundle,
  isPurchasableCourse,
  selectionTotal,
} from "@/lib/catalog/selection";
import { expandOwnedCatalogIds } from "@/lib/magster/entitlements";
import type { MagsterBundle, MagsterCourse } from "@/lib/magster/types";
import { closeTelegramMiniApp } from "@/lib/telegram/close";
import {
  encodeInitDataForTransport,
  readTelegramWebAppInitData,
  waitForTelegramInitData,
} from "@/lib/telegram/client";
import {
  hasErrors,
  validateLocalPhone,
  validateProfile,
  validationMessages,
  type ProfileErrors,
  type ProfileFields,
} from "@/lib/validation/registration";

const STEPS = 4;

type CatalogTab = "bundles" | "courses";

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function SelectionDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        selected ? "border-brand bg-brand text-white" : "border-line bg-white"
      }`}
    >
      {selected ? (
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

function catalogLockLabel(owned: boolean, purchasable: boolean): string | null {
  if (owned) return "Already Purchased";
  if (!purchasable) return "Coming soon";
  return null;
}

function CatalogLockBadge({ label }: { label: string }) {
  return (
    <span className="mt-1.5 inline-flex rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
      {label}
    </span>
  );
}

function CourseSelectCard({
  course,
  selected,
  disabled,
  lockLabel,
  onToggle,
}: {
  course: MagsterCourse;
  selected: boolean;
  disabled?: boolean;
  lockLabel?: string | null;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      aria-pressed={selected}
      disabled={disabled}
      className={`w-full rounded-card border px-2.5 py-2 text-left touch-manipulation ${
        selected ? "border-brand bg-brand/5" : "border-line bg-surface"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-[13px] font-semibold leading-4 text-ink">{course.title}</h3>
            {disabled ? null : <SelectionDot selected={selected} />}
          </div>
          <p className="mt-0.5 text-[12px] font-semibold text-brand">{formatEtb(course.price)}</p>
          {lockLabel ? <CatalogLockBadge label={lockLabel} /> : null}
        </div>
      </div>
    </button>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function BundleSelectCard({
  bundle,
  selected,
  disabled,
  lockLabel,
  onToggle,
  onPreview,
}: {
  bundle: MagsterBundle;
  selected: boolean;
  disabled?: boolean;
  lockLabel?: string | null;
  onToggle: () => void;
  onPreview: () => void;
}) {
  const original = bundleOriginalTotal(bundle);
  return (
    <div
      className={`flex w-full items-stretch overflow-hidden rounded-card border ${
        selected ? "border-brand bg-brand/5" : "border-line bg-surface"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={disabled ? undefined : onToggle}
        aria-pressed={selected}
        disabled={disabled}
        className="min-w-0 flex-1 px-2.5 py-2 text-left touch-manipulation"
      >
        <div className="flex items-center gap-2.5">
          {bundle.thumbnailUrl ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bundle.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-1 text-[13px] font-semibold leading-4 text-ink">{bundle.title}</h3>
              {disabled ? null : <SelectionDot selected={selected} />}
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <p className="text-[12px] font-semibold text-brand">{formatEtb(bundle.price)}</p>
              {original > bundle.price ? (
                <p className="text-[11px] text-hint line-through">{formatEtb(original)}</p>
              ) : null}
            </div>
            {lockLabel ? <CatalogLockBadge label={lockLabel} /> : null}
          </div>
        </div>
      </button>
      <button
        type="button"
        aria-label={`View courses in ${bundle.title}`}
        onClick={onPreview}
        className="flex w-9 shrink-0 items-center justify-center border-l border-line text-ink/70 touch-manipulation"
      >
        <EyeIcon />
      </button>
    </div>
  );
}

export function RegistrationFlow({ initial }: { initial: BootstrapPayload }) {
  const router = useRouter();
  const telegram = useTelegramIdentity();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProfileFields>({
    fullName: "",
    phone: "",
    gender: "",
    academicYear: "",
    institution: "",
  });
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [tab, setTab] = useState<CatalogTab>("bundles");
  const [courseIds, setCourseIds] = useState<number[]>([]);
  const [bundleIds, setBundleIds] = useState<number[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [paymentSlug, setPaymentSlug] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [termsAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [success, setSuccess] = useState(false);
  const [legalSlug, setLegalSlug] = useState<"terms_of_service" | "privacy_policy" | null>(null);
  const [legalTitle, setLegalTitle] = useState("");
  const [legalBody, setLegalBody] = useState("");
  const [legalLoading, setLegalLoading] = useState(false);
  const [previewBundle, setPreviewBundle] = useState<MagsterBundle | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [existingStudentId, setExistingStudentId] = useState<number | null>(null);
  const [ownedCourseIds, setOwnedCourseIds] = useState<number[]>([]);
  const [ownedBundleIds, setOwnedBundleIds] = useState<number[]>([]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkPin, setLinkPin] = useState("");
  const [linkPinError, setLinkPinError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [linked, setLinked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const phoneCheckSeq = useRef(0);

  const courses = initial.catalog?.courses ?? [];
  const bundles = initial.catalog?.bundles ?? [];
  const methods = initial.paymentMethods ?? [];
  const academicYears = initial.registration?.academicYears.map((item) => item.name) ?? [];
  const institutions = initial.registration?.institutions.map((item) => item.name) ?? [];
  const selectedMethod = methods.find((method) => method.slug === paymentSlug) ?? null;
  const owned = useMemo(
    () =>
      expandOwnedCatalogIds({
        courses,
        bundles,
        ownedCourseIds,
        ownedBundleIds,
      }),
    [courses, bundles, ownedCourseIds, ownedBundleIds],
  );
  const purchasableCourseIds = useMemo(
    () => courseIds.filter((id) => !owned.courseIds.has(id)),
    [courseIds, owned.courseIds],
  );
  const purchasableBundleIds = useMemo(
    () => bundleIds.filter((id) => !owned.bundleIds.has(id)),
    [bundleIds, owned.bundleIds],
  );
  const total = selectionTotal(courses, bundles, purchasableCourseIds, purchasableBundleIds);
  const selectedCount = purchasableCourseIds.length + purchasableBundleIds.length;

  const selectedLabels = useMemo(() => {
    const names = [
      ...bundles.filter((bundle) => purchasableBundleIds.includes(bundle.id)).map((bundle) => bundle.title),
      ...courses.filter((course) => purchasableCourseIds.includes(course.id)).map((course) => course.title),
    ];
    return names;
  }, [bundles, courses, purchasableBundleIds, purchasableCourseIds]);

  const filteredBundles = useMemo(() => {
    const needle = catalogQuery.trim().toLowerCase();
    if (!needle) return bundles;
    return bundles.filter(
      (bundle) =>
        bundle.title.toLowerCase().includes(needle) ||
        bundle.includedCourseTitles.some((title) => title.toLowerCase().includes(needle)),
    );
  }, [bundles, catalogQuery]);

  const filteredCourses = useMemo(() => {
    const needle = catalogQuery.trim().toLowerCase();
    if (!needle) return courses;
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(needle) ||
        course.description.toLowerCase().includes(needle),
    );
  }, [courses, catalogQuery]);

  useEffect(() => {
    if (telegram.state === "loading") return;

    let cancelled = false;
    void (async () => {
      try {
        const initData = (await waitForTelegramInitData()) || readTelegramWebAppInitData();
        const response = await fetch("/api/bootstrap", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Init-Data": initData,
          },
          body: JSON.stringify({
            initData,
            initDataB64: encodeInitDataForTransport(initData),
          }),
        });
        const payload = (await response.json()) as BootstrapPayload;
        if (cancelled || !response.ok || !payload.ok || !payload.resume) return;
        const resume = payload.resume;
        setExistingStudentId(resume.studentId);
        setOwnedCourseIds(resume.ownedCourseIds);
        setOwnedBundleIds(resume.ownedBundleIds);
        setProfile({
          fullName: resume.fullName,
          phone: resume.phone.replace(/\D/g, "").slice(-9),
          gender: resume.gender,
          academicYear: resume.academicYear,
          institution: resume.institution,
        });
        setCourseIds((current) => current.filter((id) => !resume.ownedCourseIds.includes(id)));
        setBundleIds((current) => current.filter((id) => !resume.ownedBundleIds.includes(id)));
        if (resume.profileComplete) setStep(2);
      } catch {
        // New visitors stay on profile creation.
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [telegram.state]);

  async function copyValue(field: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1500);
  }

  async function checkPhoneTaken(phone: string): Promise<"taken" | "available" | "error"> {
    const seq = ++phoneCheckSeq.current;
    try {
      const response = await fetch("/api/phone-availability", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": readTelegramWebAppInitData(),
        },
        body: JSON.stringify({
          phone,
          initData: readTelegramWebAppInitData(),
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; taken?: boolean };
      if (seq !== phoneCheckSeq.current) return "available";
      if (!response.ok || !payload.ok) return "error";
      return payload.taken ? "taken" : "available";
    } catch {
      if (seq !== phoneCheckSeq.current) return "available";
      return "error";
    }
  }

  const phoneTaken = profileErrors.phone === validationMessages.phoneTaken;

  async function submitExistingLink() {
    if (linking) return;
    if (!/^\d{4}$/.test(linkPin.trim())) {
      setLinkPinError("Enter the 4-digit PIN for this Magster account.");
      return;
    }
    setLinking(true);
    setLinkPinError(null);
    try {
      const response = await fetch("/api/link-existing", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": readTelegramWebAppInitData(),
        },
        body: JSON.stringify({
          phone: profile.phone,
          pin: linkPin.trim(),
          initData: readTelegramWebAppInitData(),
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        code?: string;
      };
      if (!response.ok || !payload.ok) {
        setLinkPinError(
          payload.code === "incorrect_pin"
            ? "Incorrect PIN for this account. Please try again."
            : payload.message || "Could not link your account.",
        );
        return;
      }
      setLinked(true);
      setLinkPinError(null);
      window.setTimeout(() => router.push("/"), 1200);
    } catch {
      setLinkPinError("Could not link your account. Please try again.");
    } finally {
      setLinking(false);
    }
  }

  useEffect(() => {
    if (existingStudentId) return;
    if (validateLocalPhone(profile.phone)) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        const result = await checkPhoneTaken(profile.phone);
        if (result === "taken") {
          setProfileErrors((current) => ({ ...current, phone: validationMessages.phoneTaken }));
        }
      })();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [profile.phone, existingStudentId]);

  async function goNextFromProfile() {
    const errors = validateProfile(profile);
    setProfileErrors(errors);
    if (hasErrors(errors)) return;
    if (existingStudentId) {
      setStep(2);
      return;
    }
    setCheckingPhone(true);
    try {
      const result = await checkPhoneTaken(profile.phone);
      if (result === "taken") {
        setProfileErrors((current) => ({ ...current, phone: validationMessages.phoneTaken }));
        return;
      }
      if (result === "error") {
        setProfileErrors((current) => ({ ...current, phone: validationMessages.phoneCheckFailed }));
        return;
      }
      setStep(2);
    } finally {
      setCheckingPhone(false);
    }
  }

  function goNextFromCatalog() {
    if (!purchasableCourseIds.length && !purchasableBundleIds.length) {
      setSelectionError(
        owned.courseIds.size || owned.bundleIds.size
          ? "Choose a course or bundle you have not already purchased."
          : validationMessages.selection,
      );
      return;
    }
    setSelectionError(null);
    setStep(3);
  }

  function goNextFromPayment() {
    if (!selectedMethod) {
      setPaymentError(validationMessages.paymentMethod);
      return;
    }
    setPaymentError(null);
    setStep(4);
  }

  function onReceipt(file: File | null) {
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    if (!file) {
      setReceipt(null);
      setReceiptPreview(null);
      setReceiptError(null);
      return;
    }
    const type = file.type.toLowerCase();
    if (!["image/jpeg", "image/jpg", "image/png"].includes(type)) {
      setReceiptError(validationMessages.receiptType);
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setReceiptError(validationMessages.receiptSize);
      return;
    }
    setReceipt(file);
    setReceiptPreview(URL.createObjectURL(file));
    setReceiptError(null);
  }

  async function openLegal(slug: "terms_of_service" | "privacy_policy") {
    setLegalSlug(slug);
    setLegalLoading(true);
    setLegalTitle(slug === "terms_of_service" ? "Terms of Service" : "Privacy Policy");
    setLegalBody("");
    try {
      const response = await fetch(`/api/legal/${slug}`, { credentials: "include" });
      const payload = (await response.json()) as {
        ok?: boolean;
        page?: { title?: string; body?: string };
      };
      if (response.ok && payload.ok && payload.page) {
        setLegalTitle(payload.page.title || (slug === "terms_of_service" ? "Terms of Service" : "Privacy Policy"));
        setLegalBody(payload.page.body || "");
      }
    } finally {
      setLegalLoading(false);
    }
  }

  async function confirm() {
    if (submitting) return;
    if (!receipt) {
      setReceiptError(validationMessages.receiptRequired);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const initData = await waitForTelegramInitData();
      if (!initData) {
        setSubmitError(
          "Open Magster from the Telegram Mini App, not a normal browser, so Telegram can be linked.",
        );
        return;
      }
      const form = new FormData();
      form.set("fullName", profile.fullName.trim());
      form.set("phone", profile.phone);
      form.set("gender", profile.gender);
      form.set("academicYear", profile.academicYear);
      form.set("institution", profile.institution);
      form.set("courseIds", JSON.stringify(purchasableCourseIds));
      form.set("bundleIds", JSON.stringify(purchasableBundleIds));
      form.set("paymentMethod", paymentSlug);
      form.set("termsAccepted", termsAccepted ? "true" : "false");
      form.set("receipt", receipt);
      form.set("initData", initData);
      form.set("initDataB64", encodeInitDataForTransport(initData));
      const response = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "X-Telegram-Init-Data": initData },
        body: form,
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; code?: string };
      if (response.status === 409 || payload.code === "phone_registered") {
        setStep(1);
        setProfileErrors((current) => ({
          ...current,
          phone: validationMessages.phoneTaken,
        }));
        return;
      }
      if (payload.code === "already_purchased") {
        setStep(2);
        setSelectionError(payload.message || "Those items are already on your account.");
        return;
      }
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Could not submit your registration.");
      }
      setSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not submit your registration.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!sessionReady) {
    return (
      <main className="flex h-full min-h-0 flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="-mx-5 border-b border-line bg-white px-5 pb-3 pt-[max(0.6rem,env(safe-area-inset-top))] text-center text-[15px] font-semibold text-ink">
          Magster
        </div>
        <p className="mt-16 text-center text-[14px] text-muted">Checking your Magster account…</p>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex h-full min-h-0 flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="-mx-5 border-b border-line bg-white px-5 pb-3 pt-[max(0.6rem,env(safe-area-inset-top))] text-center text-[15px] font-semibold text-ink">
          Magster
        </div>
        <div className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-5xl" aria-hidden="true">
            🎉
          </p>
          <h1 className="mt-4 text-[24px] font-bold tracking-[-0.04em] text-ink">
            You&apos;ve completed registration!
          </h1>
          <p className="mt-4 max-w-[22rem] text-[15px] leading-6 text-muted">
            Once we verify your submitted information and receipt, your account will be approved. ✅
          </p>
        </div>
        <PrimaryButton onClick={closeTelegramMiniApp}>Done</PrimaryButton>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 flex-1 flex-col px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <WizardHeader
        step={step}
        total={STEPS}
        onBack={() => {
          if (step === 1) {
            router.push("/");
            return;
          }
          setStep((current) => current - 1);
        }}
      />

      {step === 1 ? (
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          <h1 className="text-[16px] font-semibold tracking-tight text-ink">Your profile</h1>
          <p className="mt-0.5 text-[12px] text-muted">A few details to create your Magster account.</p>
          <div className="mt-3 space-y-2.5">
            <TextField
              id="full-name"
              label="Full Name"
              autoComplete="name"
              placeholder="Enter Full Name"
              value={profile.fullName}
              onChange={(event) => {
                setProfile((current) => ({ ...current, fullName: event.target.value }));
                setProfileErrors((current) => ({ ...current, fullName: undefined }));
              }}
              error={profileErrors.fullName}
            />
            <PhoneField
              id="phone"
              value={profile.phone}
              onChange={(value) => {
                setProfile((current) => ({ ...current, phone: value }));
                setProfileErrors((current) => ({ ...current, phone: undefined }));
              }}
              error={profileErrors.phone}
            />
            {phoneTaken ? (
              <div className="rounded-card border border-brand/30 bg-brand/5 p-3">
                <p className="text-xs leading-5 text-muted">
                  This phone number is already registered to a Magster account. If it&apos;s yours,
                  link it to your Telegram to continue without creating a new account.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLinkOpen(true);
                    setLinkPin("");
                    setLinkPinError(null);
                  }}
                  className="mt-2 text-sm font-bold text-brand touch-manipulation"
                >
                  I already have an account — link it
                </button>
              </div>
            ) : null}
            <OptionPicker
              label="Gender"
              options={GENDERS}
              value={profile.gender}
              placeholder="Select gender"
              onChange={(value) => {
                setProfile((current) => ({ ...current, gender: value }));
                setProfileErrors((current) => ({ ...current, gender: undefined }));
              }}
              error={profileErrors.gender}
            />
            <OptionPicker
              label="Academic Year"
              options={academicYears}
              value={profile.academicYear}
              placeholder="Select academic year"
              onChange={(value) => {
                setProfile((current) => ({ ...current, academicYear: value }));
                setProfileErrors((current) => ({ ...current, academicYear: undefined }));
              }}
              error={profileErrors.academicYear}
            />
            <OptionPicker
              label="Institution"
              value={profile.institution}
              options={institutions}
              placeholder="Select institution"
              searchable
              searchPlaceholder="Search institutions"
              onChange={(value) => {
                setProfile((current) => ({ ...current, institution: value }));
                setProfileErrors((current) => ({ ...current, institution: undefined }));
              }}
              error={profileErrors.institution}
            />
          </div>
          </div>
          <div className="shrink-0 pt-3">
            <PrimaryButton onClick={() => void goNextFromProfile()} disabled={checkingPhone}>
              {checkingPhone ? "Checking phone…" : "Continue"}
            </PrimaryButton>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between gap-3 pt-3">
            <h1 className="min-w-0 truncate text-[16px] font-semibold tracking-tight text-ink">
              Choose learning
            </h1>
            <span className="shrink-0 text-[11px] font-medium text-muted">
              {selectedCount ? `${selectedCount} selected` : "Pick any"}
            </span>
          </div>
          <div className="mt-2 flex h-10 shrink-0 items-center gap-2 rounded-card border border-line bg-white px-2.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-muted" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              placeholder="Search bundles or courses"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-hint"
            />
          </div>
          <div className="mt-2 grid shrink-0 grid-cols-2 rounded-card bg-white p-0.5">
            {(["bundles", "courses"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`h-9 rounded-[10px] text-[13px] font-semibold touch-manipulation ${
                  tab === item ? "bg-brand text-white" : "text-muted"
                }`}
              >
                {item === "bundles" ? "Bundles" : "Courses"}
              </button>
            ))}
          </div>
          <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pb-2">
            {tab === "bundles"
              ? filteredBundles.map((bundle) => {
                  const alreadyOwned = owned.bundleIds.has(bundle.id);
                  const purchasable = isPurchasableBundle(bundle);
                  return (
                  <BundleSelectCard
                    key={bundle.id}
                    bundle={bundle}
                    selected={purchasableBundleIds.includes(bundle.id)}
                    disabled={alreadyOwned || !purchasable}
                    lockLabel={catalogLockLabel(alreadyOwned, purchasable)}
                    onToggle={() => {
                      setBundleIds((current) => toggleId(current, bundle.id));
                      setSelectionError(null);
                    }}
                    onPreview={() => setPreviewBundle(bundle)}
                  />
                  );
                })
              : filteredCourses.map((course) => {
                  const alreadyOwned = owned.courseIds.has(course.id);
                  const purchasable = isPurchasableCourse(course);
                  return (
                  <CourseSelectCard
                    key={course.id}
                    course={course}
                    selected={purchasableCourseIds.includes(course.id)}
                    disabled={alreadyOwned || !purchasable}
                    lockLabel={catalogLockLabel(alreadyOwned, purchasable)}
                    onToggle={() => {
                      setCourseIds((current) => toggleId(current, course.id));
                      setSelectionError(null);
                    }}
                  />
                  );
                })}
            {(tab === "bundles" ? filteredBundles : filteredCourses).length === 0 ? (
              <p className="py-8 text-center text-[13px] text-muted">No matches for that search.</p>
            ) : null}
          </div>
          <div className="shrink-0 space-y-2 border-t border-line bg-canvas pt-2">
          {selectionError ? (
            <p role="alert" className="text-sm font-medium text-danger">
              {selectionError}
            </p>
          ) : null}
          <div className="flex items-center justify-between rounded-card border border-line bg-white px-3 py-2">
            <p className="text-[13px] font-semibold text-ink">{formatSelectionTotal(total)}</p>
            <p className="text-[11px] text-muted">{selectedCount ? `${selectedCount} selected` : "None selected"}</p>
          </div>
          <PrimaryButton onClick={goNextFromCatalog}>Continue</PrimaryButton>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          <h1 className="text-[16px] font-semibold tracking-tight text-ink">Payment method</h1>
          <p className="mt-0.5 text-[12px] text-muted">Pay the exact Magster total to one of the accounts below.</p>
          <div className="mt-3 space-y-2">
            {methods.map((method) => {
              const selected = method.slug === paymentSlug;
              return (
                <div
                  key={method.slug}
                  className={`rounded-card border ${
                    selected ? "border-brand bg-white" : "border-line bg-surface"
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setPaymentSlug(method.slug);
                      setPaymentError(null);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left touch-manipulation"
                  >
                    <p className="text-[13px] font-semibold text-ink">{method.name}</p>
                    <SelectionDot selected={selected} />
                  </button>
                  {selected ? (
                    <div className="space-y-2 border-t border-line px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-hint">
                            Account holder
                          </p>
                          <p className="truncate text-[13px] font-medium text-ink">
                            {method.accountHolder || "—"}
                          </p>
                        </div>
                        {method.accountHolder ? (
                          <button
                            type="button"
                            className="shrink-0 text-[11px] font-semibold text-brand"
                            onClick={() => void copyValue(`${method.slug}-holder`, method.accountHolder)}
                          >
                            {copiedField === `${method.slug}-holder` ? "Copied" : "Copy"}
                          </button>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-2.5 py-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-hint">
                            Account number
                          </p>
                          <p className="font-mono text-[14px] font-semibold tracking-wide text-ink">
                            {method.accountNumber || "—"}
                          </p>
                        </div>
                        {method.accountNumber ? (
                          <button
                            type="button"
                            className="shrink-0 text-[11px] font-semibold text-brand"
                            onClick={() => void copyValue(`${method.slug}-number`, method.accountNumber)}
                          >
                            {copiedField === `${method.slug}-number` ? "Copied" : "Copy"}
                          </button>
                        ) : null}
                      </div>
                      <p className="text-[12px] font-semibold text-ink">{formatSelectionTotal(total)}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {paymentError ? (
            <p role="alert" className="mt-2 text-sm font-medium text-danger">
              {paymentError}
            </p>
          ) : null}
          </div>
          <div className="shrink-0 pt-3">
            <PrimaryButton onClick={goNextFromPayment}>Continue</PrimaryButton>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          <h1 className="text-[16px] font-semibold tracking-tight text-ink">Upload receipt</h1>
          <p className="mt-0.5 text-[12px] text-muted">Confirm the payment, then attach your receipt.</p>
          <div className="mt-3 rounded-card border border-line bg-white px-3 py-2.5">
            <p className="text-[13px] font-semibold text-ink">{selectedMethod?.name}</p>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{selectedLabels.join(" · ")}</p>
            <p className="mt-1 text-[13px] font-semibold text-ink">{formatSelectionTotal(total)}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            onChange={(event) => onReceipt(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 flex min-h-28 w-full flex-col items-center justify-center overflow-hidden rounded-card border border-dashed border-line bg-white px-3 text-center touch-manipulation"
          >
            {receiptPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={receiptPreview} alt="Receipt preview" className="max-h-28 w-full object-contain" />
            ) : (
              <>
                <p className="text-sm font-bold text-ink">Tap to upload receipt</p>
                <p className="mt-1 text-xs text-muted">JPG or PNG, up to 3 MB</p>
              </>
            )}
          </button>
          {receipt ? (
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-brand"
              onClick={() => {
                onReceipt(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Remove / replace
            </button>
          ) : null}
          {receiptError ? (
            <p role="alert" className="mt-2 text-sm font-medium text-danger">
              {receiptError}
            </p>
          ) : null}
          {submitError ? (
            <p role="alert" className="mt-2 text-sm font-medium text-danger">
              {submitError}
            </p>
          ) : telegram.state === "browser" ||
            telegram.state === "invalid" ||
            telegram.state === "unconfigured" ? (
            <p role="alert" className="mt-2 text-sm font-medium text-danger">
              {telegram.message}
            </p>
          ) : null}
          {submitting ? (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted">Uploading receipt and submitting…</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-brand" />
              </div>
            </div>
          ) : null}
          <div className="mt-3 space-y-2 rounded-card border border-line bg-white px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Terms and policies
            </p>
            <label className="flex items-start gap-2 text-[12px] leading-4 text-ink">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={() => undefined}
                onClick={(event) => event.preventDefault()}
                aria-checked="true"
                className="mt-0.5 h-5 w-5 accent-brand"
              />
              <span>
                I agree to the{" "}
                <button
                  type="button"
                  className="font-semibold text-brand"
                  onClick={() => void openLegal("terms_of_service")}
                >
                  Terms of Service
                </button>
                .
              </span>
            </label>
            <label className="flex items-start gap-2 text-[12px] leading-4 text-ink">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={() => undefined}
                onClick={(event) => event.preventDefault()}
                aria-checked="true"
                className="mt-0.5 h-5 w-5 accent-brand"
              />
              <span>
                I agree to the{" "}
                <button
                  type="button"
                  className="font-semibold text-brand"
                  onClick={() => void openLegal("privacy_policy")}
                >
                  Privacy Policy
                </button>
                .
              </span>
            </label>
          </div>
          </div>
          <div className="shrink-0 pt-3">
            <PrimaryButton onClick={confirm} disabled={submitting || !receipt}>
              {submitting ? "Submitting…" : "Confirm"}
            </PrimaryButton>
          </div>
        </section>
      ) : null}

      {previewBundle ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close bundle courses"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setPreviewBundle(null)}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] w-full max-w-[430px] flex-col rounded-t-3xl bg-surface shadow-soft">
            <div className="flex items-center justify-between px-5 pt-4">
              <h2 className="pr-3 text-lg font-bold text-ink">{previewBundle.title}</h2>
              <button
                type="button"
                className="h-11 shrink-0 text-sm font-semibold text-brand"
                onClick={() => setPreviewBundle(null)}
              >
                Close
              </button>
            </div>
            <ol className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
              {previewBundle.includedCourseTitles.length ? (
                previewBundle.includedCourseTitles.map((title, index) => (
                  <li key={`${previewBundle.id}-${title}-${index}`} className="flex gap-3 py-2.5">
                    <span className="w-6 shrink-0 text-sm font-bold text-brand">{index + 1}.</span>
                    <span className="text-sm font-medium leading-5 text-ink">{title}</span>
                  </li>
                ))
              ) : (
                <li className="py-6 text-sm text-muted">No included courses are listed for this bundle.</li>
              )}
            </ol>
          </div>
        </div>
      ) : null}

      {legalSlug ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close legal document"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setLegalSlug(null)}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] w-full max-w-[430px] flex-col rounded-t-3xl bg-surface shadow-soft">
            <div className="flex items-center justify-between px-5 pt-4">
              <h2 className="text-lg font-bold text-ink">{legalTitle}</h2>
              <button
                type="button"
                className="h-11 text-sm font-semibold text-brand"
                onClick={() => setLegalSlug(null)}
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
              {legalLoading ? (
                <div className="space-y-2 py-4">
                  <div className="h-4 animate-pulse rounded bg-line" />
                  <div className="h-4 animate-pulse rounded bg-line" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
                </div>
              ) : (
                <article className="whitespace-pre-wrap pb-4 text-sm leading-6 text-muted">
                  {legalBody}
                </article>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {linkOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close link account"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setLinkOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] w-full max-w-[430px] flex-col rounded-t-3xl bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-soft">
            {linked ? (
              <>
                <p className="text-center text-3xl" aria-hidden="true">
                  🎉
                </p>
                <h2 className="mt-3 text-center text-xl font-bold text-ink">
                  Telegram linked to your account
                </h2>
                <p className="mt-2 text-center text-sm text-muted">
                  Your Magster account is now connected to Telegram.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-ink">Link your account</h2>
                  <button
                    type="button"
                    className="h-11 shrink-0 text-sm font-semibold text-brand"
                    onClick={() => setLinkOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted">
                  Enter the 4-digit PIN for the Magster account registered to{" "}
                  <span className="font-semibold text-ink">{profile.phone}</span>.
                </p>
                <div className="mt-5">
                  <TextField
                    id="link-pin"
                    label="PIN"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={linkPin}
                    onChange={(event) => {
                      setLinkPin(event.target.value.replace(/\D/g, ""));
                      setLinkPinError(null);
                    }}
                    error={linkPinError ?? undefined}
                  />
                </div>
                <div className="mt-6">
                  <PrimaryButton onClick={() => void submitExistingLink()} disabled={linking}>
                    {linking ? "Linking…" : "Link account"}
                  </PrimaryButton>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
