"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

function getDisplayName(session: Session | null): string {
  if (!session) return "Tamu";
  const user = session.user;
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const fullName = metadata?.full_name;
  const name = metadata?.name;

  if (typeof fullName === "string" && fullName.trim().length > 0)
    return fullName;
  if (typeof name === "string" && name.trim().length > 0) return name;
  return user.email?.split("@")[0] ?? "Pengguna";
}

function getUserMetadata(session: Session | null): Record<string, unknown> {
  return session?.user.user_metadata as Record<string, unknown> | undefined ?? {};
}

function getAvatarUrl(session: Session | null, displayName: string): string {
  const metadata = getUserMetadata(session);
  const avatarUrl = metadata.avatar_url;
  if (typeof avatarUrl === "string" && avatarUrl.trim().length > 0) {
    return avatarUrl;
  }

  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;
}

function getBio(session: Session | null): string {
  const metadata = getUserMetadata(session);
  const bio = metadata.bio;
  return typeof bio === "string" ? bio : "";
}

function formatDate(value: string | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AccountPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    bio: "",
    avatarUrl: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const hasCheckedSession = useRef(false);

  const clearAvatarSelection = () => {
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!session) {
      setProfileForm({ fullName: "", bio: "", avatarUrl: "" });
      clearAvatarSelection();
      setSavedAvatarUrl(null);
      return;
    }

    const metadata = getUserMetadata(session);
    setProfileForm({
      fullName: String(metadata.full_name ?? metadata.name ?? ""),
      bio: String(metadata.bio ?? ""),
      avatarUrl: String(metadata.avatar_url ?? ""),
    });
    clearAvatarSelection();
    setSavedAvatarUrl(String(metadata.avatar_url ?? "") || null);
  }, [session]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session ?? null);
      setIsLoading(false);
      hasCheckedSession.current = true;
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
    router.replace("/");
  };

  const handleRefreshSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session ?? null);
    setIsLoading(false);
    clearAvatarSelection();
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) {
      setProfileForm((current) => ({
        ...current,
        avatarUrl: "",
      }));
    }
  };

  const uploadAvatarToStorage = async (file: File): Promise<string> => {
    if (!session) {
      throw new Error("Masuk dulu untuk mengunggah foto profil.");
    }

    const fileExt = file.name.split(".").pop() ?? "png";
    const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/png",
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) {
      setProfileMessage("Masuk dulu untuk menyimpan profil.");
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage(null);
    setIsUploadingAvatar(Boolean(avatarFile));

    const fullName = profileForm.fullName.trim();
    const bio = profileForm.bio.trim();
    let avatarUrl = profileForm.avatarUrl.trim();

    try {
      if (avatarFile) {
        avatarUrl = await uploadAvatarToStorage(avatarFile);
      }

      const nextMetadata = {
        ...getUserMetadata(session),
        full_name: fullName,
        name: fullName,
        bio,
        avatar_url: avatarUrl,
      };

      const { data, error } = await supabase.auth.updateUser({
        data: nextMetadata,
      });

      if (error) {
        setProfileMessage(error.message ?? "Gagal menyimpan profil.");
        return;
      }

      const nextSession = data.user ? { ...session, user: data.user } : session;
      setSession(nextSession);
      setSavedAvatarUrl(avatarUrl || null);
      clearAvatarSelection();
      await handleRefreshSession();
      
      router.refresh();
      
      setProfileMessage(
        avatarFile
          ? "Profil dan foto berhasil disimpan."
          : "Profil berhasil disimpan.",
      );
    } catch (error) {
      setProfileMessage(
        error instanceof Error ? error.message : "Gagal menyimpan profil.",
      );
    } finally {
      setIsSavingProfile(false);
      setIsUploadingAvatar(false);
    }
  };

  const displayName = getDisplayName(session);
  const email = session?.user.email ?? "Tamu belum login";
  const createdAt = formatDate(session?.user.created_at);
  const lastSignIn = formatDate(session?.user.last_sign_in_at ?? undefined);
  const bio = getBio(session);
  const avatarUrl = getAvatarUrl(session, displayName);
  const liveDisplayName =
    profileForm.fullName.trim().length > 0 ? profileForm.fullName.trim() : displayName;
  const liveBio = profileForm.bio.trim().length > 0 ? profileForm.bio.trim() : bio;
  const liveAvatarUrl =
    avatarPreviewUrl ??
    savedAvatarUrl ??
    (profileForm.avatarUrl.trim().length > 0 ? profileForm.avatarUrl.trim() : avatarUrl);

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "GM";

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 md:px-8 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95 font-bold"
          >
            ←
          </Link>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">
            Akun Saya
          </h1>
        </div>

        {session ? (
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isLoading || isSigningOut}
            className="rounded-full bg-rose-50 text-rose-600 border border-rose-200 px-4 py-1.5 text-xs font-bold transition hover:bg-rose-100 active:scale-95 disabled:opacity-50"
          >
            {isSigningOut ? "Keluar..." : "Keluar Akun"}
          </button>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-sky-50 text-sky-600 border border-sky-200 px-4 py-1.5 text-xs font-bold transition hover:bg-sky-100 active:scale-95"
          >
            Login Sekarang
          </Link>
        )}
      </header>

      <div className="mx-auto w-full max-w-4xl px-4 md:px-8 pt-6 flex flex-col gap-6">
        {isLoading ? (
          <div className="animate-pulse flex flex-col gap-6">
            <div className="h-40 rounded-3xl bg-slate-200" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-32 rounded-2xl bg-slate-200" />
              <div className="h-32 rounded-2xl bg-slate-200" />
              <div className="h-32 rounded-2xl bg-slate-200" />
            </div>
          </div>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                <div className="h-24 w-24 shrink-0 rounded-full border-4 border-white shadow-md bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl font-black text-slate-400 overflow-hidden">
                  <img
                    src={liveAvatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500 mb-1">
                    {session ? "Profil Pengguna" : "Profil Tamu"}
                  </p>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    {liveDisplayName}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {email}
                  </p>
                  {liveBio ? (
                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                      {liveBio}
                    </p>
                  ) : null}

                  {session ? (
                    <span className="inline-block mt-3 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-emerald-100">
                      Status: Aktif
                    </span>
                  ) : (
                    <span className="inline-block mt-3 px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-slate-200">
                      Status: Belum Login
                    </span>
                  )}
                </div>
              </div>

              <div className="relative z-10 mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Dibuat Sejak
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {createdAt}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Terakhir Masuk
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {lastSignIn}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-[1fr_2fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
                  Aksi Cepat
                </p>
                <div className="space-y-3">
                  <Link
                    href="/spin"
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 active:scale-95"
                  >
                    <span className="text-lg">🎰</span> Buka Spin Makanan
                  </Link>
                  <Link
                    href="/map"
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-600 hover:border-sky-100 active:scale-95"
                  >
                    <span className="text-lg">📍</span> Lihat Peta Restoran
                  </Link>
                  <Link
                    href="/blind"
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-800 hover:text-white active:scale-95"
                  >
                    <span className="text-lg">🎲</span> Coba Blind Gacha
                  </Link>
                </div>
              </div>

              <div className="grid gap-4">
                <form
                  onSubmit={(e) => void handleSaveProfile(e)}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Edit Profil
                      </p>
                      <h3 className="mt-2 text-base font-bold text-slate-900 tracking-tight">
                        Ubah foto, nama, dan biodata
                      </h3>
                    </div>

                  </div>

                  <div className="mt-5 grid gap-4">
                    <label className="grid gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Nama tampil
                      </span>
                      <input
                        value={profileForm.fullName}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            fullName: event.target.value,
                          }))
                        }
                        placeholder="Contoh: Sulthan Dhiyazka"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      />
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Foto profil dari URL
                      </span>
                      <input
                        value={profileForm.avatarUrl}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            avatarUrl: event.target.value,
                          }))
                        }
                        placeholder="Tempel URL foto, atau biarkan kosong untuk avatar otomatis"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      />
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Upload foto baru
                      </span>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-rose-500 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:bg-slate-100"
                      />
                      <p className="text-xs text-slate-500">
                        Pilih file gambar untuk diunggah.
                        Kalau diisi, ini akan dipakai menggantikan URL di atas.
                      </p>
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Biodata singkat
                      </span>
                      <textarea
                        value={profileForm.bio}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            bio: event.target.value,
                          }))
                        }
                        rows={4}
                        placeholder="Contoh: Mahasiswa lapar yang suka cari makan enak dan murah."
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-rose-500/30 transition hover:bg-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSavingProfile
                        ? isUploadingAvatar
                          ? "Mengunggah foto..."
                          : "Menyimpan..."
                        : "Simpan Profil"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRefreshSession()}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                    >
                      Muat ulang data
                    </button>
                  </div>

                  {profileMessage ? (
                    <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {profileMessage}
                    </p>
                  ) : null}
                </form>

                {session ? (
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col text-left transition hover:border-rose-200 hover:bg-rose-50 active:scale-[0.99]"
                  >
                    <span className="text-2xl mb-3">🚪</span>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Keluar Akun
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      Tekan kartu ini untuk keluar dari sesi aktif dan kembali
                      ke halaman utama.
                    </p>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col text-left transition hover:border-rose-200 hover:bg-rose-50 active:scale-[0.99]"
                  >
                    <span className="text-2xl mb-3">🚀</span>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Mode Tamu (Guest)
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      Kamu sedang masuk sebagai tamu. Klik kartu ini untuk
                      masuk dengan magic link email.
                    </p>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => void handleRefreshSession()}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col text-left transition hover:border-sky-200 hover:bg-sky-50 active:scale-[0.99]"
                >
                  <span className="text-2xl mb-3">🔄</span>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Sinkronkan Profil
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Klik untuk memuat ulang sesi Supabase dan menyegarkan data
                    akun di halaman ini.
                  </p>
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}