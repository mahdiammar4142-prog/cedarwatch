import type { Profile } from "../types";

export function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CW";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function profileLabel(profile: Profile | null, email?: string | null) {
  return profile?.displayName?.trim() || email?.split("@")[0] || "Watcher";
}

export function UserAvatar({
  profile,
  email,
  size = "md",
}: {
  profile: Profile | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const label = profileLabel(profile, email);
  const dim = size === "lg" ? "h-24 w-24 text-2xl" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs";

  if (profile?.avatarUrl) {
    return (
      <img
        src={profile.avatarUrl}
        alt={label}
        className={`${dim} rounded-full object-cover ring-2 ring-[#d4a017]/70`}
      />
    );
  }

  return (
    <span
      className={`${dim} inline-flex items-center justify-center rounded-full bg-[#10261a] font-semibold text-[#d4a017] ring-2 ring-[#d4a017]/70`}
    >
      {initialsFrom(label)}
    </span>
  );
}
