/**
 * One certificate per course (Final Exam pass). Dedupes by courseId when present.
 */
export function uniqueCourseCertificates<
  T extends { courseId?: string | null; id?: string },
>(certificates: T[] | null | undefined): T[] {
  if (!certificates?.length) return [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const cert of certificates) {
    const key = cert.courseId || cert.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(cert);
  }
  return out;
}

export function uniqueCourseCertificateCount(
  certificates: Array<{ courseId?: string | null; id?: string }> | null | undefined,
): number {
  return uniqueCourseCertificates(certificates).length;
}
