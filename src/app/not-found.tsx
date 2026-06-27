"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <section>
        <div className="flex mx-auto gap-90 items-center">
          <div>
            <img src="/logo.png" alt="img" width={900} />
          </div>
          <div className="w-114">
            <h1 className="text-4xl ">
              <span className="uppercase">Oops!</span> Page not found
            </h1>
            <p className="mt-4 text-[#9A9A9C]">
              You must have picked the wrong door because I haven't been able to
              lay my eye on the page you've been searching for.
            </p>
            <div className="mt-10">
              <button
                onClick={() => router.back()}
                className="flex justify-center gap-2 p-6 uppercase rounded-2xl bg-[#4E0E78] hover:bg-white hover:text-black transition duration-200 items-center py-3 cursor-pointer text-sm tracking-widest "
              >
                <ArrowLeft size={20} /> back
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
