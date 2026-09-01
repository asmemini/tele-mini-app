"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand/brand-mark";
import { OptionPicker } from "@/components/ui/option-picker";
import { PhoneField } from "@/components/ui/phone-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextField } from "@/components/ui/text-field";
import { WizardProgress } from "@/components/wizard/wizard-progress";
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
import type { MagsterBundle, MagsterCourse } from "@/lib/magster/types";
import { closeTelegramMiniApp } from "@/lib/telegram/close";
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

function CourseSelectCard({
  course,
  selected,
  disabled,
  onToggle,
}: {
  course: MagsterCourse;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      aria-pressed={selected}
      disabled={disabled}
      className={`w-full rounded-card border p-3 text-left shadow-soft transition-colors touch-manipulation ${
        selected ? "border-brand bg-brand/5" : "border-line bg-surface"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <div className="flex gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-brand-soft/50">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold text-ink">{course.title}</h3>
            <SelectionDot selected={selected} />
          </div>
          {course.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted">{course.description}</p>
          ) : null}
          <p className="mt-2 text-sm font-bold text-brand">{formatEtb(course.price)}</p>
        </div>
      </div>
      {disabled ? (
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-hint">
          Coming soon
        </p>
      ) : null}
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
  onToggle,
  onPreview,
}: {
  bundle: MagsterBundle;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onPreview: () => void;
}) {
  const original = bundleOriginalTotal(bundle);
  return (
    <div
      className={`flex w-full items-stretch overflow-hidden rounded-card border shadow-soft ${
        selected ? "border-brand bg-brand/5" : "border-line bg-surface"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={disabled ? undefined : onToggle}
        aria-pressed={selected}
        disabled={disabled}
        className="min-w-0 flex-1 p-3 text-left touch-manipulation"
      >
        <div className="flex gap-3">
          {bundle.thumbnailUrl ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-brand-soft/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bundle.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">Bundle</p>
              <SelectionDot selected={selected} />
            </div>
            <h3 className="mt-1 text-sm font-semibold text-ink">{bundle.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-muted">
              {bundle.includedCourseTitles.slice(0, 3).join(" · ") || bundle.description}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-sm font-bold text-brand">{formatEtb(bundle.price)}</p>
              {original > bundle.price ? (
                <p className="text-xs text-hint line-through">{formatEtb(original)}</p>
              ) : null}
            </div>
          </div>
        </div>
      </button>
      <button
        type="button"
        aria-label={`View courses in ${bundle.title}`}
        onClick={onPreview}
        className="flex w-12 shrink-0 items-center justify-center border-l border-line text-brand touch-manipulation"
      >
        <EyeIcon />
      </button>
    </div>
  );
}

export function RegistrationFlow({ initial }: { initial: BootstrapPayload }) {
  const router = useRouter();
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
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const [legalSlug, setLegalSlug] = useState<"terms_of_service" | "privacy_policy" | null>(null);
  const [legalTitle, setLegalTitle] = useState("");
  const [legalBody, setLegalBody] = useState("");
  const [legalLoading, setLegalLoading] = useState(false);
  const [previewBundle, setPreviewBundle] = useState<MagsterBundle | null>(null);
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
  const total = selectionTotal(courses, bundles, courseIds, bundleIds);
  const selectedCount = courseIds.length + bundleIds.length;

  const selectedLabels = useMemo(() => {
    const names = [
      ...bundles.filter((bundle) => bundleIds.includes(bundle.id)).map((bundle) => bundle.title),
      ...courses.filter((course) => courseIds.includes(course.id)).map((course) => course.title),
    ];
    return names;
  }, [bundles, courses, bundleIds, courseIds]);

  async function checkPhoneTaken(phone: string): Promise<"taken" | "available" | "error"> {
    const seq = ++phoneCheckSeq.current;
    try {
      const response = await fetch("/api/phone-availability", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: profile.phone, pin: linkPin.trim() }),
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
  }, [profile.phone]);

  async function goNextFromProfile() {
    const errors = validateProfile(profile);
    setProfileErrors(errors);
    if (hasErrors(errors)) return;
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
    if (!courseIds.length && !bundleIds.length) {
      setSelectionError(validationMessages.selection);
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
      const form = new FormData();
      form.set("fullName", profile.fullName.trim());
      form.set("phone", profile.phone);
      form.set("gender", profile.gender);
      form.set("academicYear", profile.academicYear);
      form.set("institution", profile.institution);
      form.set("courseIds", JSON.stringify(courseIds));
      form.set("bundleIds", JSON.stringify(bundleIds));
      form.set("paymentMethod", paymentSlug);
      form.set("termsAccepted", termsAccepted ? "true" : "false");
      form.set("receipt", receipt);
      const response = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
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

  if (success) {
    return (
      <main className="flex h-full min-h-0 flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,calc(env(safe-area-inset-top)+0.75rem))]">
        <p className="text-center text-[20px] font-bold tracking-[-0.03em] text-ink">Magster</p>
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
    <main className="flex h-full min-h-0 flex-1 flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))]">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (step === 1) {
              router.push("/");
              return;
            }
            setStep((current) => current - 1);
          }}
          className="h-11 text-sm font-semibold text-brand touch-manipulation"
        >
          Back
        </button>
        <BrandMark size="sm" />
      </div>
      <WizardProgress step={step} total={STEPS} />

      {step === 1 ? (
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          <h1 className="text-[26px] font-bold tracking-[-0.04em] text-ink">Your profile</h1>
          <p className="mt-1 text-sm text-muted">A few details to create your Magster account.</p>
          <div className="mt-5 space-y-4">
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
          <h1 className="shrink-0 text-[26px] font-bold tracking-[-0.04em] text-ink">Choose learning</h1>
          <p className="mt-1 shrink-0 text-sm text-muted">Select Magster bundles and courses. You can pick more than one.</p>
          <div className="mt-4 grid shrink-0 grid-cols-2 rounded-card bg-white p-1 shadow-soft">
            {(["bundles", "courses"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`h-11 rounded-[16px] text-sm font-bold touch-manipulation ${
                  tab === item ? "bg-brand text-white" : "text-muted"
                }`}
              >
                {item === "bundles" ? "Bundles" : "Courses"}
              </button>
            ))}
          </div>
          <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pb-3">
            {tab === "bundles"
              ? bundles.map((bundle) => (
                  <BundleSelectCard
                    key={bundle.id}
                    bundle={bundle}
                    selected={bundleIds.includes(bundle.id)}
                    disabled={!isPurchasableBundle(bundle)}
                    onToggle={() => {
                      setBundleIds((current) => toggleId(current, bundle.id));
                      setSelectionError(null);
                    }}
                    onPreview={() => setPreviewBundle(bundle)}
                  />
                ))
              : courses.map((course) => (
                  <CourseSelectCard
                    key={course.id}
                    course={course}
                    selected={courseIds.includes(course.id)}
                    disabled={!isPurchasableCourse(course)}
                    onToggle={() => {
                      setCourseIds((current) => toggleId(current, course.id));
                      setSelectionError(null);
                    }}
                  />
                ))}
          </div>
          <div className="shrink-0 space-y-3 border-t border-line bg-canvas pt-3">
          {selectionError ? (
            <p role="alert" className="text-sm font-medium text-danger">
              {selectionError}
            </p>
          ) : null}
          <div className="rounded-card border border-line bg-white px-4 py-3 shadow-soft">
            <p className="text-sm font-bold text-ink">{formatSelectionTotal(total)}</p>
            <p className="mt-0.5 text-xs text-muted">
              {selectedCount ? `${selectedCount} selected` : "Nothing selected yet"}
            </p>
          </div>
          <PrimaryButton onClick={goNextFromCatalog}>Continue</PrimaryButton>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          <h1 className="text-[26px] font-bold tracking-[-0.04em] text-ink">Payment method</h1>
          <p className="mt-1 text-sm text-muted">Pay the exact Magster total to one of the accounts below.</p>
          <div className="mt-5 space-y-3">
            {methods.map((method) => {
              const selected = method.slug === paymentSlug;
              return (
                <button
                  key={method.slug}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setPaymentSlug(method.slug);
                    setPaymentError(null);
                  }}
                  className={`w-full rounded-card border p-4 text-left shadow-soft touch-manipulation ${
                    selected ? "border-brand bg-brand/5" : "border-line bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink">{method.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {method.accountHolder || "Account holder unavailable"}
                      </p>
                    </div>
                    <SelectionDot selected={selected} />
                  </div>
                </button>
              );
            })}
          </div>
          {selectedMethod ? (
            <div className="mt-4 rounded-card border border-line bg-white p-4 shadow-soft">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Pay to</p>
              <p className="mt-2 text-sm font-semibold text-ink">{selectedMethod.name}</p>
              <div className="mt-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-hint">
                      Account Holder Name
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-ink">
                      {selectedMethod.accountHolder || "—"}
                    </p>
                  </div>
                  {selectedMethod.accountHolder ? (
                    <button
                      type="button"
                      className="text-xs font-bold text-brand"
                      onClick={async () => {
                        await navigator.clipboard.writeText(selectedMethod.accountHolder);
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1500);
                      }}
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  ) : null}
                </div>
                <div className="flex items-start justify-between gap-3 rounded-2xl bg-canvas px-3 py-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-hint">
                      Account Number
                    </p>
                    <p className="mt-1 font-mono text-base font-bold tracking-wide text-ink">
                      {selectedMethod.accountNumber || "—"}
                    </p>
                  </div>
                  {selectedMethod.accountNumber ? (
                    <button
                      type="button"
                      className="text-xs font-bold text-brand"
                      onClick={async () => {
                        await navigator.clipboard.writeText(selectedMethod.accountNumber);
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1500);
                      }}
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-sm font-bold text-brand">{formatSelectionTotal(total)}</p>
            </div>
          ) : null}
          {paymentError ? (
            <p role="alert" className="mt-3 text-sm font-medium text-danger">
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
          <h1 className="text-[26px] font-bold tracking-[-0.04em] text-ink">Upload receipt</h1>
          <p className="mt-1 text-sm text-muted">Confirm the payment details, then attach your receipt.</p>
          <div className="mt-5 rounded-card border border-line bg-white p-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Summary</p>
            <p className="mt-2 text-sm font-semibold text-ink">{selectedMethod?.name}</p>
            <p className="mt-1 text-xs text-muted">{selectedLabels.join(" · ")}</p>
            <p className="mt-3 text-sm font-bold text-brand">{formatSelectionTotal(total)}</p>
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
            className="mt-4 flex min-h-40 w-full flex-col items-center justify-center overflow-hidden rounded-card border border-dashed border-brand/40 bg-brand/5 px-4 text-center touch-manipulation"
          >
            {receiptPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={receiptPreview} alt="Receipt preview" className="max-h-48 w-full object-contain" />
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
          ) : null}
          {submitting ? (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted">Uploading receipt and submitting…</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-brand" />
              </div>
            </div>
          ) : null}
          <div className="mt-4 space-y-3 rounded-card border border-line bg-white p-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
              Terms and policies
            </p>
            <label className="flex items-start gap-3 text-sm text-ink">
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
            <label className="flex items-start gap-3 text-sm text-ink">
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
