"use client";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AlternativesSection({ alternatives = [] }) {
  const hasAlternatives =
    alternatives && Array.isArray(alternatives) && alternatives.length > 0;

  const router = useRouter();

  return (
    <motion.section
      className="w-full bg-white border border-[#e5dcc5] rounded-2xl shadow-sm p-6 mt-4"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {hasAlternatives ? (
        <div className="max-h-[200px] overflow-y-scroll">
          {alternatives.map((alt, index) => (
            <motion.div
              key={index}
              className="border border-[#ece7d6] rounded-xl p-4 bg-[#faf7ef] hover:bg-[#f6eedb]/50 transition cursor-pointer mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.1 }}
              onClick={() => router.push(`/${alt.code}`)}
            >
              <p className="text-[#3d3a24] text-lg font-medium">
                {alt.product_name}
              </p>
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
