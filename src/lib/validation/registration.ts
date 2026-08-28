import {
  GENDERS,
  LOCAL_PHONE_LENGTH,
  VALID_PHONE_PREFIXES,
  type Gender,
} from "@/lib/constants/auth";

const FULL_NAME_PATTERN = /^[A-Za-z]+ [A-Za-z]+$/;

export const validationMessages = {
  fullName:
    "Please enter your first name and father's name using English letters only.",
  phoneLength: "Phone number must contain exactly 9 digits.",
  phonePrefix: "Ethiopian phone numbers must begin with 9 or 7 after +251.",
  phoneTaken:
    "This phone number is already taken. Please use a different phone number or enter your own correct phone number.",
  phoneCheckFailed: "Could not verify this phone number. Please try again.",
  gender: "Please select your gender.",
  academicYear: "Please select your academic year.",
  institution: "Please select your institution.",
  selection: "Please select at least one course or bundle.",
  paymentMethod: "Please select a payment method.",
  receiptRequired: "Please upload a payment receipt.",
  receiptType: "Please select a JPG, JPEG, or PNG image.",
  receiptSize: "The selected image exceeds the maximum size of 3 MB.",
} as const;

export function digitsOnly(value: string, maxLength?: number): string {
  const digits = value.replace(/\D/g, "");
  return maxLength == null ? digits : digits.slice(0, maxLength);
}

export function validateFullName(value: string): string | undefined {
  if (!FULL_NAME_PATTERN.test(value.trim())) return validationMessages.fullName;
  return undefined;
}

export function validateLocalPhone(value: string): string | undefined {
  if (value.length !== LOCAL_PHONE_LENGTH) return validationMessages.phoneLength;
  if (!VALID_PHONE_PREFIXES.includes(value[0] as (typeof VALID_PHONE_PREFIXES)[number])) {
    return validationMessages.phonePrefix;
  }
  return undefined;
}

export function validateGender(value: string): string | undefined {
  if (!GENDERS.includes(value as Gender)) return validationMessages.gender;
  return undefined;
}

export function validateRequiredChoice(value: string, message: string): string | undefined {
  if (!value.trim()) return message;
  return undefined;
}

export type ProfileFields = {
  fullName: string;
  phone: string;
  gender: string;
  academicYear: string;
  institution: string;
};

export type ProfileErrors = Partial<Record<keyof ProfileFields, string>>;

export function validateProfile(fields: ProfileFields): ProfileErrors {
  const errors: ProfileErrors = {};
  const fullName = validateFullName(fields.fullName);
  const phone = validateLocalPhone(fields.phone);
  const gender = validateGender(fields.gender);
  const academicYear = validateRequiredChoice(
    fields.academicYear,
    validationMessages.academicYear,
  );
  const institution = validateRequiredChoice(
    fields.institution,
    validationMessages.institution,
  );
  if (fullName) errors.fullName = fullName;
  if (phone) errors.phone = phone;
  if (gender) errors.gender = gender;
  if (academicYear) errors.academicYear = academicYear;
  if (institution) errors.institution = institution;
  return errors;
}

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}
