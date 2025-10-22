"use client";
import React from "react";

export default function ESGScore({ esg }) {
    const data = esg || {
        environmental: 82,
        social: 76,
        governance: 88
    };

    const overall = (
        (data.environmental + data.social + data.governance) / 3
 ).toFixed(0);

    return (
        <div className="p-4 bg-[#F9FAFB] border border-gray-200 w-full">
            <h2 className="text-base font-semibold mb-3 text-gray-900">
                ESG Score Breakdown 
            </h2>

            <div className="space-y-2 text-sm">
                {/* Environmental */}
                <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Environmental</span>
                    <span className="font-semibold text-gray-900">
                        {data.environmental}/100
                </span>
            </div>

                {/* Social */}
                <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Social</span>
                    <span className="font-semibold text-gray-900">
                        {data.social}/100
                </span>
            </div>

                {/* Governance */}
                <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Governance</span>
                    <span className="font-semibold text-gray-900">
                        {data.governance}/100
                </span>
            </div>
            </div>

           {/* Divider */} 
           <div className="mt-4 border-t border-gray-300 pt-3 flex justify-between text-sm text-gray-800">
                <span className="font-medium">Overall ESG Score</span>
                <span className="font-bold text-green-700">{overall}/100</span>
              </div>
        </div>
    );
}