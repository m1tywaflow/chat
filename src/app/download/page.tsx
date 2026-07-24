import Image from "next/image";

async function getLatestRelease() {
  const res = await fetch(
    "https://api.github.com/repos/m1tywaflow/chat/releases/latest",
    {
      next: { revalidate: 3600 },
      headers: process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {},
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const asset = data.assets?.find((a: any) => a.name.endsWith(".exe"));

  return {
    version: data.tag_name?.replace(/^v/, "") ?? null,
    downloadUrl: asset?.browser_download_url ?? null,
    fileName: asset?.name ?? null,
  };
}

export default async function DownloadPage() {
  const release = await getLatestRelease();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090F] px-6 text-white">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[180px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Logo"
          width={84}
          height={84}
          priority
          className="mb-6 select-none"
        />

        <h1 className="text-5xl font-bold tracking-tight">Nexo</h1>

        <p className="mt-3 text-zinc-400">Fast native messenger for Windows.</p>

        {release?.downloadUrl ? (
          <>
            <a
              href={release.downloadUrl}
              download
              className="
                mt-10
                flex
                h-14
                w-full
                items-center
                justify-center
                rounded-2xl
                border
                border-violet-500/30
                bg-zinc-900
                text-base
                font-medium
                transition-all
                duration-300
                hover:border-violet-400
                hover:bg-zinc-800
                hover:shadow-[0_0_30px_rgba(139,92,246,.25)]
                active:scale-[0.98]
              "
            >
              Download for Windows
            </a>

            <p className="mt-5 text-sm text-zinc-500">
              Version {release.version}
            </p>
          </>
        ) : (
          <p className="mt-8 text-sm text-red-400">
            Failed to retrieve the latest version.
          </p>
        )}
      </div>
    </main>
  );
}
