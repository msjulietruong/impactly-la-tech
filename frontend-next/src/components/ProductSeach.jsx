"use client";
import React, { useState } from "react";
import Input from "./Input";
import Button from "./Button";
import Modal from "./Modal";
import BarcodeScanner from "./BarcodeScanner";
import { useRouter } from "next/navigation";
const ProductSeach = ({ initialInput }) => {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
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
    router.push(`/products?upc=${encodeURIComponent(code)}`);
    setIsScannerOpen(false);
  };
  console.log("Render ProductSearch with searchResult:", searchResult);
  return (
    <div>
      <div className="flex flex-col items-center justify-center flex-1 gap-6 p-10">
        <Input
          value={initialInput || inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type product name or barcode..."
        />
        <Button label="Search" onClick={handleSearch} />
        <Button label="Scan Barcode" onClick={() => setIsScannerOpen(true)} />
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
