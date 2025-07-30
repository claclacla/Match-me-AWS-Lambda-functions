export const PROFILE_SECTION_KEYS = {
    PERSONAL_INFORMATION: "personalInformation",
    AVATAR: "avatar",
    GROUP_PERSONAL_EXPERIENCE: "groupPersonalExperience",
    GROUP_INSIGHTS: "groupInsights"
} as const;

export type ProfileSectionKey = typeof PROFILE_SECTION_KEYS[keyof typeof PROFILE_SECTION_KEYS];