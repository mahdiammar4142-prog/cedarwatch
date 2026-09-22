import { Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { UserAvatar, profileLabel } from "../components/UserAvatar";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [area, setArea] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setArea(profile.area ?? "");
    setBio(profile.bio ?? "");
  }, [profile]);

  if (loading) return <p className="text-stone-500">Loading profile...</p>;
  if (!user) return <Navigate to="/" replace state={{ from: "/profile" }} />;

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.updateMe({ displayName, area, bio });
      await refreshProfile();
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      await api.uploadAvatar(file);
      await refreshProfile();
      setMessage("Photo updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload photo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="stamp text-[var(--cedar-green)]">Your lookout</p>
        <h1 className="font-display mt-2 text-3xl text-[var(--cedar-dark)] sm:text-4xl">
          Profile
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          A name, a neighborhood, and a photo so neighbors know who is watching
          the grid with them.
        </p>
      </div>

      <section className="ticket px-5 py-6 sm:px-7">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <UserAvatar profile={profile} email={user.email} size="lg" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cedar-gold)] text-[var(--cedar-dark)] shadow disabled:opacity-60"
              aria-label="Add photo"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <p className="font-display text-xl text-[var(--cedar-dark)]">
            {profileLabel(profile, user.email)}
          </p>
          <p className="text-sm text-stone-500">{user.email}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhoto}
          />
          <p className="text-xs text-stone-500">
            {uploading ? "Uploading photo..." : "JPEG, PNG, or WebP · max 2 MB"}
          </p>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Display name
            </label>
            <input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
              placeholder="e.g. Nour from Hamra"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="area" className="mb-1 block text-sm font-medium">
              Neighborhood
            </label>
            <input
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              maxLength={80}
              placeholder="Hamra, Beirut"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="bio" className="mb-1 block text-sm font-medium">
              Short note
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              rows={4}
              placeholder="I report cuts on my street so others can plan."
              className="field"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          )}
          {message && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {message}
            </p>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </section>

      <p className="text-center text-sm text-stone-600">
        <Link to="/map" className="font-medium text-[var(--cedar-green)] hover:underline">
          Back to the live map
        </Link>
      </p>
    </div>
  );
}
