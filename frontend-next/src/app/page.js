"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Scan } from "lucide-react";
import ProductSeach from "@/components/ProductSeach";

export default function Home() {
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault(); // Prevent page reload
    if (searchText.trim() !== "") {
      router.push(`/results?query=${encodeURIComponent(searchText)}`);
    }
  };

  return (
    <main className="relative flex flex-col items-center justify-start min-h-screen bg-[#f6eedb] font-[var(--font-fredoka)] overflow-hidden">
      {/* Background eco world */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
        <Image
          src="/eco-world.png"
          alt="Eco world background"
          width={900}
          height={900}
          className="opacity-40 translate-y-20 md:translate-y-80 lg:translate-y-120 scale-110"
          priority
        />
      </div>

      {/* Hero Section: Text + Search */}
      <div className="w-full relative z-10 flex flex-col items-center text-center">
        <h1
          className="text-5xl md:text-6xl font-extrabold text-[#66754C] tracking-tight leading-none"
          style={{
            WebkitTextStroke: "0.8px rgba(102,117,76,0.08)",
            textShadow:
              "0 6px 0 rgba(0,0,0,0.06), 0 2px 0 rgba(102,117,76,0.06), 1px 0 0 rgba(102,117,76,0.02)",
            marginBottom: "-6px",
          }}
        >
          Impactly
        </h1>

        <p className="text-[#1a1a1a] text-xl md:text-2xl leading-tight mt-6">
          Better for You. <br /> Better for the Planet.
        </p>
        <div className="md:w-1/2 mt-2">
          {" "}
          <ProductSeach />
        </div>
      </div>
    </main>
  );
}
