"use client";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import Input from "../components/Input";
import Modal from "../components/Modal";
import BarcodeScanner from "../components/BarcodeScanner";

export default function Home() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [scannedCode, setScannedCode] = useState("");

  const handleSearch = () => {
    alert(`Searching for "${inputValue}"...`);
  };

  const handleScan = (code) => {
  console.log("Scanned barcode:", code);
  setScannedCode(code);
  setIsScannerOpen(false);
};

  return (
    <div className="min-h-screen flex flex-col justify-between bg-base-100 text-base-content">
      {/* Navbar */}
      <Navbar onOpenModal={() => setIsHelpOpen(true)} />

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center flex-1 gap-6 p-10">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type product name or barcode..."
        />
        <Button label="Search" onClick={handleSearch} />
        <Button label="Scan Barcode" onClick={() => setIsScannerOpen(true)} />
      </main>
    
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

      {/* Help Modal */}
      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Help">
        <p>Enter a product name or barcode to check its ethical rating.</p>
      </Modal>

      {/* Footer */}
      <Footer />
    </div>
  );
}
