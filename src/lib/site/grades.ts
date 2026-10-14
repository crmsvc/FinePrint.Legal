/** Grade sort value — higher is better */
export function gradeValue(grade: string): number {
  const scale: Record<string, number> = {
    "A+": 13, A: 12, "A-": 11,
    "B+": 10, B: 9, "B-": 8,
    "C+": 7, C: 6, "C-": 5,
    "D+": 4, D: 3, "D-": 2,
    F: 1,
  };
  return scale[grade] ?? 0;
}

/** Returns true if grade qualifies for Hall of Fame (B- or higher) */
export function isHallOfFame(grade: string): boolean {
  return gradeValue(grade) >= 8; // B- = 8
}
