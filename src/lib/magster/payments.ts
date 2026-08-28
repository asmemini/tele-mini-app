/**
 * Magster payment integration points.
 */
export const MagsterPayment = {
  methodsTable: "app_payment_methods",
  requestsTable: "payment_requests",
  submitRpc: "submit_student_payment_request",
  approveRpc: "admin_approve_payment_request",
  receiptsBucket: "payment-receipts",
} as const;
