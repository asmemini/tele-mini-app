/**
 * Existing Magster table names. Do not invent replacements.
 * Source of truth: Magster Admin Panel → Supabase project `mrzmhtirmxqnnoqppnyf`.
 */
export const MagsterTables = {
  students: "students",
  courses: "courses",
  bundles: "bundles",
  bundleCourses: "bundle_courses",
  paymentRequests: "payment_requests",
  paymentMethods: "app_payment_methods",
  studentAccess: "student_access",
  studentAccessHistory: "student_access_history",
  appSettings: "app_settings",
  appRegistrationOptions: "app_registration_options",
  appLegalPages: "app_legal_pages",
  homeSections: "home_sections",
} as const;

export const MagsterRpc = {
  registerStudentSecure: "register_student_secure",
  verifyStudentLoginPin: "verify_student_login_pin",
  fetchStudentForLogin: "fetch_student_for_login",
  getAppEditsConfig: "get_app_edits_config",
  submitStudentPaymentRequest: "submit_student_payment_request",
  fetchStudentPayments: "fetch_student_payments",
  getStudentAccessRows: "get_student_access_rows",
  grantCourseAccess: "grant_course_access",
  grantBundleAccess: "grant_bundle_access",
  adminApprovePaymentRequest: "admin_approve_payment_request",
  attachStudentTelegram: "attach_student_telegram",
  linkStudentTelegramByPin: "link_student_telegram_by_pin",
  miniAppSessionByTelegram: "mini_app_session_by_telegram",
} as const;

export const MagsterStorage = {
  paymentReceipts: "payment-receipts",
  paymentScreenshot: "payment_screenshot",
  courseImages: "course-images",
  courseThumbnails: "course-thumbnails",
  appAssets: "app-assets",
} as const;
