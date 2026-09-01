import type { ReactNode } from "react";
import { formatEtb } from "@/lib/format/etb";
import { bundleOriginalTotal } from "@/lib/catalog/selection";
import type { MagsterBundle, MagsterCourse } from "@/lib/magster/types";

const BUNDLE_ACCENTS = ["#6B21A8", "#2563C9", "#E07B16"] as const;

function courseSubtitle(course: MagsterCourse): string {
  const description = course.description.trim();
  if (description) return description;
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
    <article className="w-[160px] shrink-0 overflow-hidden rounded-2xl border border-[#D1D5DB] bg-white shadow-[0_4px_12px_rgb(15_23_42_/_0.04)]">
      <div className="relative h-[88px] bg-[#DBEAFE]">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-brand">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
              <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h11A1.5 1.5 0 0 1 20 4.5v15a.75.75 0 0 1-1.2.6L16 18.25l-2.8 1.85A.75.75 0 0 1 12 19.5V5.25H7.5A1.5 1.5 0 0 0 6 6.75v12a.75.75 0 0 1-1.5 0v-12A3 3 0 0 1 7.5 3.75" />
            </svg>
          </div>
        )}
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/45 text-white">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
            <path d="M17 9V8a5 5 0 0 0-10 0v1H5.5A1.5 1.5 0 0 0 4 10.5v8A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 18.5 9H17Zm-8.5-1a3.5 3.5 0 1 1 7 0v1h-7V8Z" />
          </svg>
        </span>
      </div>
      <div className="px-2 pb-2 pt-1.5">
        <h3 className="line-clamp-1 text-[11px] font-bold leading-[1.15] tracking-[-0.01em] text-ink">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-[9.5px] leading-[1.2] text-muted">{courseSubtitle(course)}</p>
        <p className="mt-1 text-[12px] font-bold text-brand">{formatEtb(course.price)}</p>
      </div>
    </article>
  );
}

function BundlePreviewCard({ bundle, index }: { bundle: MagsterBundle; index: number }) {
  const original = bundleOriginalTotal(bundle);
  const accent = BUNDLE_ACCENTS[index % BUNDLE_ACCENTS.length];
  const titles = bundle.includedCourseTitles.slice(0, 5);
  const remaining = Math.max(0, bundle.includedCourseTitles.length - titles.length);
  return (
    <article
      className="flex h-[160px] w-[268px] shrink-0 flex-col overflow-hidden rounded-2xl p-3 text-white"
      style={{ backgroundColor: accent }}
    >
      <h3 className="line-clamp-1 text-[15px] font-extrabold leading-[1.12]">{bundle.title}</h3>
      <div className="mt-1.5 min-h-0 flex-1 overflow-hidden pl-5">
        {titles.length ? (
          <ul className="space-y-[3px]">
            {titles.map((title) => (
              <li key={title} className="flex items-start gap-1.5 text-[13px] font-semibold leading-4 text-white/94">
                <span className="mt-[3px] h-[7px] w-[7px] shrink-0 rounded-full bg-white/85" />
                <span className="line-clamp-1">{title}</span>
              </li>
            ))}
            {remaining > 0 ? (
              <li className="text-[13px] font-extrabold text-[#FFF176]">& {remaining} more</li>
            ) : null}
          </ul>
        ) : (
          <p className="line-clamp-3 text-[12px] font-semibold leading-4 text-white/90">{bundle.description}</p>
        )}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <p className="text-[17px] font-black tracking-[-0.02em]">{formatEtb(bundle.price)}</p>
        {original > bundle.price ? (
          <p className="text-[12px] font-medium text-white/80 line-through decoration-white decoration-1">
            {formatEtb(original)}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function PreviewRow({
  title,
  children,
  loading,
  empty,
}: {
  title: string;
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
}) {
  return (
    <section className="mt-5">
      <h2 className="px-5 text-[17px] font-semibold text-ink">{title}</h2>
      <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading ? (
          <>
            <div className="h-[160px] w-[160px] shrink-0 animate-pulse rounded-2xl bg-white/80" />
            <div className="h-[160px] w-[160px] shrink-0 animate-pulse rounded-2xl bg-white/80" />
            <div className="h-[160px] w-[160px] shrink-0 animate-pulse rounded-2xl bg-white/80" />
          </>
        ) : empty ? (
          <p className="py-6 text-sm text-muted">No {title.toLowerCase()} are available yet.</p>
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
      <PreviewRow title="Courses" loading={loading} empty={!loading && courses.length === 0}>
        {courses.map((course) => (
          <CoursePreviewCard key={course.id} course={course} />
        ))}
      </PreviewRow>
      <PreviewRow title="Bundles" loading={loading} empty={!loading && bundles.length === 0}>
        {bundles.map((bundle, index) => (
          <BundlePreviewCard key={bundle.id} bundle={bundle} index={index} />
        ))}
      </PreviewRow>
    </div>
  );
}
