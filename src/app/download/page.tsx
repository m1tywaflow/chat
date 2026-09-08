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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080D] px-6 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-280px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/[0.12] blur-[180px]" />
        <div className="absolute bottom-[-300px] left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/[0.06] blur-[160px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-[430px] flex-col items-center text-center">
        <div className="mb-7 rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-3 shadow-2xl shadow-violet-950/20 backdrop-blur-xl">
          <Image
            src="/logo.png"
            alt="Nexo"
            width={76}
            height={76}
            priority
            className="select-none rounded-[18px]"
          />
        </div>

        <h1 className="text-5xl font-bold tracking-[-0.04em] sm:text-[56px]">
          Nexo
        </h1>

        <p className="mt-3 max-w-sm text-[15px] leading-6 text-zinc-400">
          Fast, private and native messenger for Windows.
        </p>

        {release?.downloadUrl ? (
          <div className="mt-10 w-full">
            <a
              href={release.downloadUrl}
              download
              className="group flex h-14 w-full items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.06] px-6 text-[15px] font-semibold text-white shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all duration-300 hover:border-violet-400/30 hover:bg-white/[0.09] hover:shadow-[0_10px_50px_rgba(139,92,246,0.20)] active:scale-[0.985]"
            >
              <span>Download for Windows</span>
              <svg
                className="ml-2.5 h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M10 3V14M10 14L6 10M10 14L14 10M4 17H16"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Latest version {release.version}</span>
            </div>
          </div>
        ) : (
          <p className="mt-8 text-sm text-red-400">
            Failed to retrieve the latest version.
          </p>
        )}
      </div>
    </main>
  );
}

