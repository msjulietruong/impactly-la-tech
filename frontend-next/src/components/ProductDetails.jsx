"use client";
import React, { useState } from "react";
import ESGScore from "./ESGScore";
import { ChevronDown, ChevronRight } from "lucide-react";    

export default function ProductDetails({ product }) {
  const data = product || {
    name: "Eco-Friendly Water Bottle",
    brand: "GreenGoods",
    description: "A sustainable water bottle made from recycled materials.",
    category: "Sustainable Living",
    esg: {
      environmental: 90,
      social: 85,
      governance: 80,
    },
  };
  console.log("Render ProductDetails with product data:", data.esg);

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-lg">
      <h2 className="text-xl font-semibold mb-2 text-gray-900">{data.name}</h2>
      <p className="text-sm text-gray-600 mb-1">Brand: {data.brand}</p>
      <p className="text-sm text-gray-600 mb-3">Category: {data.category}</p>
      <p className="text-sm text-gray-700 mb-4">{data.description}</p>

      {/* ESG Score Section */}
      <ESGScore esg={data.esg} />
    </div>
  );
}
