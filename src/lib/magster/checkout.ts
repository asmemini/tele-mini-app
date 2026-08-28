import { MagsterRpc } from "@/lib/magster/tables";
import { getMagsterSupabase } from "@/lib/supabase/server";

export async function submitMagsterPaymentRequest(input: {
  studentId: number;
  paymentMethod: string;
  receiptUrl: string;
  courseId?: number;
  bundleId?: number;
}): Promise<void> {
  const { error } = await getMagsterSupabase().rpc(MagsterRpc.submitStudentPaymentRequest, {
    p_student_id: input.studentId,
    p_payment_method: input.paymentMethod,
    p_receipt_url: input.receiptUrl,
    p_course_id: input.courseId ?? null,
    p_bundle_id: input.bundleId ?? null,
  });

  if (error) {
    throw new Error(error.message || "Could not submit the payment request.");
  }
}
