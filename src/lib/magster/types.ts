export type CatalogAvailability = "standard" | "upcoming" | "bundle_only" | "hidden";

export type MagsterCourse = {
  id: number;
  title: string;
  description: string;
  instructor: string;
  price: number;
  thumbnailUrl: string | null;
  availability: CatalogAvailability;
  totalChapters: number;
  totalLessons: number;
};

export type MagsterBundle = {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  thumbnailUrl: string | null;
  availability: CatalogAvailability;
  includedCourseIds: number[];
  includedCourseTitles: string[];
};

export type MagsterCatalog = {
  courses: MagsterCourse[];
  bundles: MagsterBundle[];
};

export type MagsterPublicSettings = {
  slogan: string;
  logoUrl: string | null;
  contactTelegram: string;
};

export type MagsterStudentIdentity = {
  id: number;
  fullName: string;
  phoneNumber: string;
  accountStatus: string;
  isActive: boolean;
};

export type MagsterPaymentMethod = {
  id: number;
  slug: string;
  name: string;
  accountHolder: string;
  accountNumber: string;
  sortOrder: number;
  isActive: boolean;
};

export type RegistrationOption = {
  name: string;
};

export type RegistrationCatalog = {
  academicYears: RegistrationOption[];
  institutions: RegistrationOption[];
  streams: RegistrationOption[];
};
