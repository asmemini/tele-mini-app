import type { MagsterBundle, MagsterCourse } from "@/lib/magster/types";

export type MiniAppStudentResume = {
  studentId: number;
  profileComplete: boolean;
  fullName: string;
  phone: string;
  gender: string;
  academicYear: string;
  institution: string;
  ownedCourseIds: number[];
  ownedBundleIds: number[];
};

export function expandOwnedCatalogIds(input: {
  courses: MagsterCourse[];
  bundles: MagsterBundle[];
  ownedCourseIds: number[];
  ownedBundleIds: number[];
}): { courseIds: Set<number>; bundleIds: Set<number> } {
  const courseIds = new Set(input.ownedCourseIds.filter((id) => id > 0));
  const bundleIds = new Set(input.ownedBundleIds.filter((id) => id > 0));

  for (const bundle of input.bundles) {
    if (!bundleIds.has(bundle.id)) continue;
    for (const courseId of bundle.includedCourseIds) courseIds.add(courseId);
  }

  for (const bundle of input.bundles) {
    if (!bundle.includedCourseIds.length) continue;
    if (bundle.includedCourseIds.every((courseId) => courseIds.has(courseId))) {
      bundleIds.add(bundle.id);
    }
  }

  return { courseIds, bundleIds };
}
