'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Scan } from 'lucide-react';
import AISummaryDisplay from "@/components/AISummaryDisplay";
import companySummary from "@/data/companySummary.json"; 
import AlternativesSection from "@/components/AlternativesSection";


import { motion } from "framer-motion";

function Section({ title, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.h3
        className="text-[#66754C] text-xl font-semibold mb-2"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {title}
      </motion.h3>
      <motion.hr
        className="border-[#a1a68b]"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        style={{ originX: 0 }}
      />
    </motion.div>
  );
}

// Dynamic score color
const score_color = (score) => {
  if (score > 80) return "#A4B782";
  if (score > 50) return "#E3C271";
  return "#BE5D5D";
};

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('query') || '';

  const [searchText, setSearchText] = useState(initialQuery);
  const [productName, setProductName] = useState(initialQuery);
  const [score, setScore] = useState(90);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchText.trim() !== '') {
      router.push(`/results?query=${encodeURIComponent(searchText)}`);
      setProductName(searchText);
    }
  };

  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-[#f6eedb] font-[var(--font-fredoka)] py-12 px-4">

      {/* 🔍 Search Bar + Scan Button */}
      <div className="relative flex items-center justify-center w-[600px] max-w-[90vw] mb-10">
        <form
          onSubmit={handleSearch}
          className="relative flex items-center w-full h-[60px] md:h-[78px]"
        >
          <input
            type="text"
            placeholder="Search here"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full h-full text-[#1a1a1a] placeholder-[#9ca18a] bg-white border-2 border-[#66754C] rounded-full pl-6 pr-[100px] text-[18px] font-extrabold focus:outline-none shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-[60px] h-[60px] md:w-[78px] md:h-[78px] rounded-full transition-all shadow-md hover:scale-105 shrink-0"
            style={{ backgroundColor: "#66754C" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7a865c")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#66754C")}
          >
            <Search size={26} color="#fff" strokeWidth={2.4} />
          </button>
        </form>

        {/* 📷 Scan Button */}
        <button
          className="ml-3 flex items-center justify-center w-[60px] h-[60px] md:w-[78px] md:h-[78px] rounded-full transition-all shadow-md hover:scale-105 shrink-0"
          style={{ backgroundColor: "#66754C" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7a865c")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#66754C")}
        >
          <Scan size={26} color="#fff" strokeWidth={2.4} />
        </button>
      </div>

      {/* 🧃 Product Card */}
      <div className="w-full max-w-5xl bg-[#f6eedb] rounded-3xl border border-[#a1a68b] p-6 md:p-10 shadow-md flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center">
          <div className="w-[200px] md:w-[250px] h-[200px] md:h-[250px] bg-white border border-[#a1a68b] rounded-3xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
            <img
              src="https://d1w7312wesee68.cloudfront.net/n2JIMitELdsrNa050f-ARRPThf47f9g6BAOvnsbfHP4/resize:fit:720:720/plain/s3://toasttab/restaurants/restaurant-50669000000000000/menu/items/3/item-500000002472761583_1588185898.png"
              alt="Tiramisu Dessert"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-[#8E9B6D] text-2xl font-medium">85 Degrees Cafe</p>
            <h2 className="text-[#66754C] text-3xl font-semibold leading-tight mt-1">
              {productName ? productName : "Water Bottle"}
            </h2>

            <div
              className="w-48 h-12 rounded-full mt-4 shadow-lg flex items-center justify-center"
              style={{ backgroundColor: score_color(score) }}
            >
              <span className="text-white text-xl font-semibold">
                Score: {score}/100
              </span>
            </div>
            {/* 🔁 Alternatives Section */}
              <AlternativesSection />
          </div>
        </div>

        {/* 📑 Sections */}
        <div className="flex flex-col gap-6 mt-4 mb-12">
          <Section title="Product Details" />
          <ul className="list-disc list-inside text-[#66754C] text-lg ml-4 space-y-1">
            <li>so tasty</li>
            <li>so yummy</li>
            <li>heals a wounded soldier</li>
          </ul>

          <Section title="Company ESG" className="mt-4" />
          
          <Section title="Summary" className="mt-4" />
          {/* ✅ AI Summary Display goes here */}
          <AISummaryDisplay company_summary={companySummary.company_summary} />
        </div>
      </div>
    </main>
  );
}
