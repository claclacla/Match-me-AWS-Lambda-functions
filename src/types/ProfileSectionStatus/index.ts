export const PROFILE_SECTION_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  SKIPPED: "skipped"
} as const;

export type ProfileSectionStatus = typeof PROFILE_SECTION_STATUS[keyof typeof PROFILE_SECTION_STATUS];