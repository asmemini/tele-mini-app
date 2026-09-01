import { MagsterTables } from "@/lib/magster/tables";
import { asNumber, asString } from "@/lib/magster/parse";
import type {
  CatalogAvailability,
  MagsterBundle,
  MagsterCatalog,
  MagsterCourse,
} from "@/lib/magster/types";
import { getMagsterSupabase } from "@/lib/supabase/server";

function availabilityFrom(
  raw: unknown,
  isBundleOnly: boolean,
  isHidden: boolean,
): CatalogAvailability {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "bundle_only" || value === "upcoming" || value === "hidden") {
    return value;
  }
  if (isHidden) return "hidden";
  if (isBundleOnly) return "bundle_only";
  return "standard";
}

function compareStudentAppCatalog<T extends { homeOrder: number | null; createdAt: string; title: string }>(
  a: T,
  b: T,
  tieBreaker: "createdAtDesc" | "titleAsc",
) {
  const aOrder = a.homeOrder;
  const bOrder = b.homeOrder;
  if (aOrder != null && bOrder != null && aOrder !== bOrder) return aOrder - bOrder;
  if (aOrder != null && bOrder == null) return -1;
  if (aOrder == null && bOrder != null) return 1;
  if (tieBreaker === "titleAsc") return a.title.localeCompare(b.title);
  return b.createdAt.localeCompare(a.createdAt);
}

export async function loadMagsterCatalog(): Promise<MagsterCatalog> {
  const client = getMagsterSupabase();
  const [courseResult, bundleResult] = await Promise.all([
    client
      .from(MagsterTables.courses)
      .select(
        "id, title, description, price, thumbnail_url, instructor, availability, is_bundle_only, is_hidden, home_order, created_at, total_chapters, total_lessons",
      )
      .eq("is_active", true)
      .order("home_order", { ascending: true, nullsFirst: false })
      .limit(40),
    client
      .from(MagsterTables.bundles)
      .select(
        "id, title, description, price, original_price, discount_percent, thumbnail_url, availability, is_hidden, home_order, created_at",
      )
      .eq("is_active", true)
      .order("home_order", { ascending: true, nullsFirst: false }),
  ]);

  if (courseResult.error) throw courseResult.error;
  if (bundleResult.error) throw bundleResult.error;

  const courseRows = (courseResult.data ?? []) as Record<string, unknown>[];
  const bundleRows = (bundleResult.data ?? []) as Record<string, unknown>[];

  const courses: MagsterCourse[] = courseRows
    .map((row) => ({
      id: asNumber(row.id),
      title: asString(row.title) || "Untitled Course",
      description: asString(row.description),
      instructor: asString(row.instructor) || "Magster Instructor",
      price: asNumber(row.price),
      thumbnailUrl: row.thumbnail_url == null ? null : String(row.thumbnail_url),
      availability: availabilityFrom(
        row.availability,
        row.is_bundle_only === true,
        row.is_hidden === true,
      ),
      totalChapters: asNumber(row.total_chapters),
      totalLessons: asNumber(row.total_lessons),
      homeOrder: row.home_order == null ? null : asNumber(row.home_order),
      createdAt: asString(row.created_at),
    }))
    .filter((course) => course.availability !== "hidden")
    .sort((a, b) => compareStudentAppCatalog(a, b, "createdAtDesc"))
    .map(({ homeOrder: _homeOrder, createdAt: _createdAt, ...course }) => course);

  const bundles: MagsterBundle[] = bundleRows
    .map((row) => ({
      id: asNumber(row.id),
      title: asString(row.title).replace(/packpage/gi, "Package") || "Untitled Bundle",
      description: asString(row.description),
      price: asNumber(row.price),
      originalPrice: row.original_price == null ? null : asNumber(row.original_price),
      discountPercent: row.discount_percent == null ? null : asNumber(row.discount_percent),
      thumbnailUrl: row.thumbnail_url == null ? null : String(row.thumbnail_url),
      availability: availabilityFrom(row.availability, false, row.is_hidden === true),
      includedCourseIds: [] as number[],
      includedCourseTitles: [] as string[],
      homeOrder: row.home_order == null ? null : asNumber(row.home_order),
      createdAt: asString(row.created_at),
    }))
    .filter((bundle) => bundle.availability !== "hidden")
    .sort((a, b) => compareStudentAppCatalog(a, b, "titleAsc"))
    .map(({ homeOrder: _homeOrder, createdAt: _createdAt, ...bundle }) => bundle);

  const bundleIds = bundles.map((bundle) => bundle.id);
  if (bundleIds.length) {
    const links = await client
      .from(MagsterTables.bundleCourses)
      .select("bundle_id, course_id, sort_order")
      .in("bundle_id", bundleIds)
      .order("sort_order", { ascending: true });

    if (links.error) throw links.error;

    const courseIds = [
      ...new Set((links.data ?? []).map((row) => asNumber((row as { course_id: unknown }).course_id))),
    ];
    const titleById = new Map<number, string>();
    if (courseIds.length) {
      const titled = await client
        .from(MagsterTables.courses)
        .select("id, title")
        .in("id", courseIds);
      if (titled.error) throw titled.error;
      for (const row of titled.data ?? []) {
        const item = row as { id: unknown; title: unknown };
        titleById.set(asNumber(item.id), asString(item.title));
      }
    }

    const titlesByBundle = new Map<number, string[]>();
    const idsByBundle = new Map<number, number[]>();
    for (const raw of links.data ?? []) {
      const row = raw as { bundle_id: unknown; course_id: unknown };
      const bundleId = asNumber(row.bundle_id);
      const courseId = asNumber(row.course_id);
      const title = titleById.get(courseId);
      if (!courseId) continue;
      const ids = idsByBundle.get(bundleId) ?? [];
      ids.push(courseId);
      idsByBundle.set(bundleId, ids);
      if (!title) continue;
      const list = titlesByBundle.get(bundleId) ?? [];
      list.push(title);
      titlesByBundle.set(bundleId, list);
    }

    const priceById = new Map(courses.map((course) => [course.id, course.price]));
    for (const bundle of bundles) {
      bundle.includedCourseIds = idsByBundle.get(bundle.id) ?? [];
      bundle.includedCourseTitles = titlesByBundle.get(bundle.id) ?? [];
      const combined = bundle.includedCourseIds.reduce(
        (sum, courseId) => sum + (priceById.get(courseId) ?? 0),
        0,
      );
      if (!bundle.originalPrice || bundle.originalPrice < bundle.price) {
        bundle.originalPrice = combined > bundle.price ? combined : bundle.originalPrice;
      }
    }
  }

  return { courses, bundles };
}
