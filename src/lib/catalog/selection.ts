import { formatEtb } from "@/lib/format/etb";
import type { MagsterBundle, MagsterCourse } from "@/lib/magster/types";

export function isPurchasableCourse(course: MagsterCourse): boolean {
  return course.availability === "standard";
}

export function isPurchasableBundle(bundle: MagsterBundle): boolean {
  return bundle.availability === "standard";
}

export function selectionTotal(
  courses: MagsterCourse[],
  bundles: MagsterBundle[],
  courseIds: number[],
  bundleIds: number[],
): number {
  const courseSet = new Set(courseIds);
  const bundleSet = new Set(bundleIds);
  const courseTotal = courses
    .filter((course) => courseSet.has(course.id))
    .reduce((sum, course) => sum + course.price, 0);
  const bundleTotal = bundles
    .filter((bundle) => bundleSet.has(bundle.id))
    .reduce((sum, bundle) => sum + bundle.price, 0);
  return courseTotal + bundleTotal;
}

export function bundleOriginalTotal(bundle: MagsterBundle): number {
  if (bundle.originalPrice != null && bundle.originalPrice > bundle.price) {
    return bundle.originalPrice;
  }
  return bundle.price;
}

export function formatSelectionTotal(total: number): string {
  return `Total Amount: ${formatEtb(total)}`;
}
