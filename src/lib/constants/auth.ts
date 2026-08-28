export const ETHIOPIAN_COUNTRY_CODE = "+251";
export const LOCAL_PHONE_LENGTH = 9;
export const VALID_PHONE_PREFIXES = ["9", "7"] as const;
export const GENDERS = ["Male", "Female"] as const;
export const DEFAULT_STREAM = "Natural Science";
export const MAX_RECEIPT_BYTES = 3 * 1024 * 1024;

export type Gender = (typeof GENDERS)[number];
