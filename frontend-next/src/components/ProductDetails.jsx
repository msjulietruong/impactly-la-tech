"use client";
import React, { useState } from "react";
import ESGScore from "./ESGScore";
import { ChevronDown, ChevronRight } from "lucide-react";    

export default function ProductDetails({ product }) {
    const [expanded, setExpanded]   = useState(false);
    const data = product || {
        name: "Eco-Friendly Water Bottle",
        brand: "GreenGoods",
        description: "A sustainable water bottle made from recycled materials.",
        category: "Water Bottle",
        esg: {
            environmental: 72,
            social: 83,
            governance: 80
        },
    };

    return (
        <div className="w-full max-wg-lg bg-white border border-gray-200 rounded-2xl shadow-sm">
            <button
            onClick={() => setExpanded(!expanded)}
            className="flex justify-between items-center w-full px-5 text-left"
            >
                <div> 
                    <h2 className="text-lg font-semibold text-gray-900">{data.name}</h2>
                    <p className="text-sm text-gray-600">Brand: {data.brand}</p>
                    </div>
                    {expanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-600"/>
                    ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500"/>
                    )}
            </button>

            {expanded && (
                <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-2">Category:{data.category}</p>
                    <p className="text-sm text-gray-700 mb-4">{data.description}</p>
                    <ESGScore esg={data.esg} />
                    </div>
            )}
        </div>
    );
}