"use client";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";

export default function AlternativesSection({ alternatives = [] }) {
  const hasAlternatives = alternatives.length > 0;

  return (
    <motion.section
      className="w-full bg-white border border-[#e5dcc5] rounded-2xl shadow-sm p-6 mt-8"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <h3 className="text-[#66754C] text-xl font-semibold mb-4">
        Alternatives
      </h3>
      <hr className="border-[#a1a68b] mb-6" />

      {/* ✅ Alternatives List */}
      {hasAlternatives ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {alternatives.map((alt, index) => (
            <motion.div
              key={index}
              className="border border-[#ece7d6] rounded-xl p-4 bg-[#faf7ef] hover:bg-[#f6eedb]/50 transition"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.1 }}
            >
              <img
                src={alt.image}
                alt={alt.name}
                className="w-full h-36 object-cover rounded-lg mb-3"
              />
              <p className="text-[#3d3a24] text-lg font-medium">{alt.name}</p>
              <p className="text-sm text-[#7a7a5b]">Score: {alt.score}/100</p>
            </motion.div>
          ))}
        </div>
      ) : (
        // ⚠️ Empty State
        <div className="flex flex-col items-center justify-center py-10 text-[#7a7a5b]">
          <SearchX size={42} className="mb-3 opacity-60" />
          <p className="text-lg font-medium">No better options found</p>
        </div>
      )}
    </motion.section>
  );
}
