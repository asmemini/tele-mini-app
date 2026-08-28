import type { ReactNode } from "react";
import { formatEtb } from "@/lib/format/etb";
import { bundleOriginalTotal } from "@/lib/catalog/selection";
import type { MagsterBundle, MagsterCourse } from "@/lib/magster/types";

const BUNDLE_ACCENTS = ["#6B21A8", "#2563C9", "#E07B16"] as const;

function courseMeta(course: MagsterCourse): string {
  if (course.availability === "upcoming") return "Coming Soon";
  if (course.availability === "bundle_only") return "Available in bundles";
  const chapters =
    course.totalChapters > 0
      ? `${course.totalChapters} ${course.totalChapters === 1 ? "Chapter" : "Chapters"}`
      : "";
  const lessons =
    course.totalLessons > 0
      ? `${course.totalLessons} ${course.totalLessons === 1 ? "Lesson" : "Lessons"}`
      : "";
  return [chapters, lessons].filter(Boolean).join(" • ") || course.instructor;
}

function CoursePreviewCard({ course }: { course: MagsterCourse }) {
  return (
    <article className="w-[132px] shrink-0 overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_2px_8px_rgb(0_0_0_/_0.04)]">
      <div className="h-[86px] bg-[#DBEAFE]">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="px-2.5 pb-2.5 pt-2">
        <h3 className="line-clamp-1 text-[11px] font-bold leading-tight tracking-[-0.01em] text-ink">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-[9.5px] text-muted">{courseMeta(course)}</p>
        <p className="mt-2 text-[13px] font-bold text-ink">{formatEtb(course.price)}</p>
      </div>
    </article>
  );
}

function BundlePreviewCard({ bundle, index }: { bundle: MagsterBundle; index: number }) {
  const original = bundleOriginalTotal(bundle);
  const accent = BUNDLE_ACCENTS[index % BUNDLE_ACCENTS.length];
  return (
    <article
      className="flex h-[148px] w-[240px] shrink-0 flex-col rounded-2xl p-3 text-white"
      style={{ backgroundColor: accent }}
    >
      <h3 className="line-clamp-1 text-[15px] font-extrabold leading-tight">{bundle.title}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-[12px] font-semibold leading-4 text-white/90">
        {bundle.includedCourseTitles.slice(0, 4).join("\n") || bundle.description}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-[16px] font-black">{formatEtb(bundle.price)}</p>
        {original > bundle.price ? (
          <p className="text-[12px] text-white/80 line-through decoration-white">{formatEtb(original)}</p>
        ) : null}
      </div>
    </article>
  );
}

function PreviewRow({
  title,
  children,
  loading,
}: {
  title: string;
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <section className="mt-5">
      <h2 className="px-5 text-[17px] font-semibold text-ink">{title}</h2>
      <div className="-mx-0 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading ? (
          <>
            <div className="h-[148px] w-[160px] shrink-0 animate-pulse rounded-2xl bg-white/80" />
            <div className="h-[148px] w-[160px] shrink-0 animate-pulse rounded-2xl bg-white/80" />
          </>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export function CatalogPreview({
  courses,
  bundles,
  loading,
}: {
  courses: MagsterCourse[];
  bundles: MagsterBundle[];
  loading?: boolean;
}) {
  return (
    <div className="min-w-0">
      <PreviewRow title="Courses" loading={loading}>
        {courses.map((course) => (
          <CoursePreviewCard key={course.id} course={course} />
        ))}
      </PreviewRow>
      <PreviewRow title="Bundles" loading={loading}>
        {bundles.map((bundle, index) => (
          <BundlePreviewCard key={bundle.id} bundle={bundle} index={index} />
        ))}
      </PreviewRow>
    </div>
  );
}
