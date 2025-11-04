"use client";
import React, { useState } from "react";
import Modal from "./Modal";
import BarcodeScanner from "./BarcodeScanner";
import { useRouter } from "next/navigation";
import { Search, ScanBarcode } from "lucide-react";

const ProductSeach = ({ initialInput }) => {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialInput || "");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const handleSearch = async () => {
    if (!inputValue.trim()) {
      alert("Please enter a product name or barcode");
      return;
    }
    router.push(`/products?query=${encodeURIComponent(inputValue.trim())}`);
  };

  const handleScan = (code) => {
    console.log("Scanned barcode:", code);
    router.push(`/${encodeURIComponent(code)}`);
    setIsScannerOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  console.log("Render ProductSearch with searchResult:", searchResult);
  return (
    <div>
      <div className="relative w-full flex items-center my-6">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type product name"
          className="w-full py-2 md:py-3 bg-white border-2 border-[var(--theme-color-primary)] rounded-full pl-6 pr-28 md:pr-32 text-base font-medium focus:outline-none shadow-sm"
          onKeyDown={handleKeyDown}
        />
        <div className=" absolute right-2 md:right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
          <button
            onClick={() => setIsScannerOpen(true)}
            className=" cursor-pointer"
          >
            <ScanBarcode
              className="w-4 h-4 md:w-5 md:h-5"
              color="#66754C"
              strokeWidth={2.4}
            />
          </button>
          <button onClick={handleSearch} className="cursor-pointer">
            <Search
              className="w-4 h-4 md:w-5 md:h-5"
              color="#66754C"
              strokeWidth={2.4}
            />
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Scan Barcode"
      >
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setIsScannerOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default ProductSeach;
