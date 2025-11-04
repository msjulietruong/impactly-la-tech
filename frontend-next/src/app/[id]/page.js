"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AISummaryDisplay from "@/components/AISummaryDisplay";
import companySummary from "@/data/companySummary.json";
import AlternativesSection from "@/components/AlternativesSection";
import {
  fetchProductById,
  fetchProductESG,
  fetchProductAlternatives,
  fetchProductSummary,
} from "@/api/productApi";

import { motion } from "framer-motion";
import ProductSeach from "@/components/ProductSeach";

function Section({ title, className = "" }) {
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
  const params = useParams();
  const router = useRouter();
  const initialQuery = params.id || "";

  const [searchText, setSearchText] = useState(initialQuery);
  const [productName, setProductName] = useState(initialQuery);
  const [score, setScore] = useState(0);

  const [product, setProduct] = useState(null);
  const [esgData, setEsgData] = useState(null);
  const [alternatives, setAlternatives] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = (initialQuery ?? "").trim();
        if (!query) {
          setError("No search query, UPC, or ID provided");
          return;
        }

        const productId = query;
        console.log("Fetching data for productId:", productId);

        const [productResult, esgResult, alternativesResult, summaryResult] =
          await Promise.allSettled([
            fetchProductById(productId),
            fetchProductESG(productId),
            fetchProductAlternatives(productId),
            fetchProductSummary(productId),
          ]);

        console.log("All results:", {
          productResult,
          esgResult,
          alternativesResult,
          summaryResult,
        });

        // PRODUCT
        if (productResult.status === "fulfilled" && productResult.value) {
          const prod = productResult.value;
          setProduct(prod);

          const name = prod?.name ?? prod?.product_name ?? initialQuery;
          setProductName(name);

          // Set ESG data from product response if available
          if (prod.esg) {
            setEsgData(prod.esg);
            setScore(prod.esg.overall.score || 0);
          }
        } else {
          console.error(
            "Product fetch failed:",
            productResult.status === "rejected"
              ? productResult.reason
              : "No value"
          );
        }

        // ESG (fallback if not in product response)
        if (!esgData && esgResult.status === "fulfilled" && esgResult.value) {
          setEsgData(esgResult.value.esgData || esgResult.value);
          if (!score && esgResult.value.esgData?.overall?.score) {
            setScore(esgResult.value.esgData.overall.score || 0);
          }
        } else if (!esgData) {
          console.error(
            "ESG fetch failed:",
            esgResult.status === "rejected" ? esgResult.reason : "No value"
          );
        }

        // ALTERNATIVES
        if (alternativesResult.status === "fulfilled") {
          setAlternatives(alternativesResult.value.alternatives);
        } else {
          console.error(
            "Alternatives fetch failed:",
            alternativesResult.status === "rejected"
              ? alternativesResult.reason
              : "No value"
          );
        }

        // SUMMARY
        if (summaryResult.status === "fulfilled") {
          // Accept either { summary: [...] } or full object
          const s = Array.isArray(summaryResult.value?.summary)
            ? summaryResult.value.summary
            : Array.isArray(summaryResult.value)
            ? summaryResult.value
            : [];

          setSummary(s ?? []);
        } else {
          console.error(
            "Summary fetch failed:",
            summaryResult.status === "rejected"
              ? summaryResult.reason
              : "No value"
          );
          setSummary([]); // ensure not null
        }
      } catch (err) {
        setError(err?.message || "Failed to fetch data");
        console.error("Data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [initialQuery]);

  console.log("pr", product);
  console.log("e", esgData);
  console.log("alt", alternatives);
  console.log("sum", summary);

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-[#f6eedb] font-[var(--font-fredoka)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-color-primary)]"></div>

        <div className="text-[#66754C] text-xl mt-8">
          Loading product information...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-[#f6eedb] font-[var(--font-fredoka)]">
        <div className="text-red-600 text-xl mb-4">Error: {error}</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-[#66754C] text-white rounded-lg hover:bg-[#7a865c]"
        >
          Go Back
        </button>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex min-h-screen bg-[#f6eedb] font-[var(--font-fredoka)] py-12 px-4">
      {/* 🔍 Search Bar + Scan Button */}
      <div className="w-full py-2 flex gap-6 items-center">
        <div onClick={() => router.push("/")} className="hidden md:block">
          <h1 className="text-3xl font-bold cursor-pointer text-[var(--theme-color-primary)]">
            Impactly
          </h1>
        </div>
        <div className="w-full">
          <ProductSeach />
        </div>
      </div>

      {/* 🧃 Product Card */}
      <div className="w-full max-w-5xl bg-[#f6eedb] rounded-3xl border border-[#a1a68b] p-6 md:p-10 shadow-md flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center">
          <div className="w-[200px] md:w-[250px] h-[200px] md:h-[250px] bg-white border border-[#a1a68b] rounded-3xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
            {product?.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name || product.product_name || "Product"}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-[#a1a68b] text-center p-4">
                <div className="text-4xl mb-2">📦</div>
                <div>No Image</div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-[#8E9B6D] text-2xl font-medium">
              {product?.brand || product?.company || "Unknown Brand"}
            </p>
            <h2 className="text-[#66754C] text-3xl font-semibold leading-tight mt-1">
              {productName || "Unknown Product"}
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
            <AlternativesSection alternatives={alternatives} />
          </div>
        </div>

        {/* 📑 Sections */}
        <div className="flex flex-col gap-6 mt-4 mb-12">
          <Section title="Product Details" />
          <ul className="list-disc list-inside text-[#66754C] text-lg ml-4 space-y-1">
            {product?.name && <li>Product Name: {product.name}</li>}
            {product?.brand && <li>Brand: {product.brand}</li>}
            {product?.category && <li>Category: {product.category}</li>}
            {!product?.name &&
              !product?.brand &&
              !product?.category &&
              !product?.brand &&
              !product?.category && <li>No product details available</li>}
          </ul>

          <Section title="Company ESG" className="mt-4" />
          <div className="text-[#66754C] text-lg ml-4 space-y-2">
            <p>Environmental Score: {esgData?.environment.score ?? "?"}/100</p>
            <p>Social Score: {esgData?.social.score ?? "?"}/100</p>
            <p>Governance Score: {esgData?.governance.score ?? "?"}/100</p>
          </div>

          <Section title="Summary" className="mt-4" />
          {/* ✅ AI Summary Display goes here */}
          <AISummaryDisplay
            company_summary={
              summary?.company_summary ||
              summary ||
              companySummary.company_summary
            }
          />
        </div>
      </div>
    </main>
  );
}
