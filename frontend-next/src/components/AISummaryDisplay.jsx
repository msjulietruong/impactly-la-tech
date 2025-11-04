"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function AISummaryDisplay({ company_summary }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(company_summary || []);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [company_summary]);

  return (
    <motion.section
      className="w-full mx-auto rounded-2xl shadow-md "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-[#66754C]">
          <Loader2 className="animate-spin mb-3" size={36} />
          <p className="text-lg font-medium">Generating insights...</p>
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="text-center py-10 text-[#66754C] italic">
          No ethical-related news found in the last year.
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="space-y-5">
          {data.map((item, index) => (
            <motion.div
              key={index}
              className="border border-[#66754C] rounded-xl p-5 bg-[#8E9B6D] text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.1 + 0.2,
                duration: 0.4,
                ease: "easeOut",
              }}
            >
              <p className="mb-3 leading-relaxed text-white">{item.text}</p>

              {item.tag && (
                <span className="inline-block text-sm bg-[#66754C] text-white px-3 py-1 rounded-full font-medium mb-2 shadow-sm">
                  {item.tag}
                </span>
              )}

              {item.sources && item.sources.length > 0 && (
                <ul className="mt-2 text-sm space-y-1">
                  {item.sources.map((src, i) => (
                    <li key={i}>
                      <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white underline"
                        style={{ textDecorationColor: "#FFFFFF" }}
                      >
                        Source {i + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
