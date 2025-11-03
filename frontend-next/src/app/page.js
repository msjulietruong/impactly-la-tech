'use client';

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Scan } from "lucide-react";

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
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Image
          src="/eco-world.png"
          alt="Eco world background"
          width={900}
          height={900}
          className="opacity-40 -translate-y-8 md:-translate-y-12 scale-110"
          priority
        />
      </div>

      {/* Hero Section: Text + Search */}
      <div className="relative z-10 flex flex-col items-center text-center -mt-8 md:-mt-12">
        <h1
          className="text-[90px] md:text-[100px] font-extrabold text-[#66754C] tracking-tight leading-none"
          style={{
            WebkitTextStroke: "0.8px rgba(102,117,76,0.08)",
            textShadow:
              "0 6px 0 rgba(0,0,0,0.06), 0 2px 0 rgba(102,117,76,0.06), 1px 0 0 rgba(102,117,76,0.02)",
            marginBottom: "-6px",
          }}
        >
          Impactly
        </h1>

        <p className="text-[#1a1a1a] text-[24px] md:text-[28px] leading-tight mt-6">
          Better for You. <br /> Better for the Planet.
        </p>

        {/* Search Bar + Scan Button */}
        <div className="relative mt-8 w-[600px] max-w-[90vw] flex items-center">
          {/* Input + Search Button */}
          <form
            onSubmit={handleSearch}
            className="relative flex-1 h-[68px] md:h-[78px]"
          >
            <input
              type="text"
              placeholder="Search here"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-full text-[#1a1a1a] placeholder-[#9ca18a] bg-white border-2 border-[#66754C] rounded-full pl-6 pr-[110px] text-[20px] font-extrabold focus:outline-none shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-[68px] h-[68px] md:w-[78px] md:h-[78px] rounded-full transition-all shadow-md hover:scale-105"
              style={{ backgroundColor: "#66754C" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#7a865c")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#66754C")
              }
            >
              <Search size={26} color="#fff" strokeWidth={2.4} />
            </button>
          </form>

          {/* Scan Button Outside Input */}
          <button
            className="ml-4 flex items-center justify-center w-[68px] h-[68px] md:w-[78px] md:h-[78px] rounded-full transition-all shadow-md hover:scale-105"
            style={{ backgroundColor: "#66754C" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#7a865c")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#66754C")
            }
          >
            <Scan size={26} color="#fff" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </main>
  );
}

