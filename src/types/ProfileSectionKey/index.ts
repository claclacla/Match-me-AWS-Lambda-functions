export const PROFILE_SECTION_KEYS = {
    PERSONAL_INFORMATION: "personalInformation",
    AVATAR: "avatar",
    GROUP_BEHAVIOR: "groupBehavior",
    VOICEPRINT: "voiceprint"
} as const;

export type ProfileSectionKey = typeof PROFILE_SECTION_KEYS[keyof typeof PROFILE_SECTION_KEYS];