"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const controlsRef = useRef(null); // for proper cleanup

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    async function startScanner() {
      try {
        const videoInputDevices =
          await BrowserMultiFormatReader.listVideoInputDevices();

        if (videoInputDevices.length === 0) {
          setError("No camera found on this device.");
          return;
        }

        const selectedDeviceId = videoInputDevices[0].deviceId;

        // start scanning
        const controls = await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              onScan(result.getText());
              stopScanner();
              onClose();
            }
            if (err && err.name !== "NotFoundException") {
              console.error(err);
            }
          }
        );

        controlsRef.current = controls;
      } catch (e) {
        console.error(e);
        setError("Unable to start the camera.");
      }
    }

    function stopScanner() {
      try {
        if (controlsRef.current) {
          controlsRef.current.stop();
          controlsRef.current = null;
        }

        // stop the camera stream
        const stream = videoRef.current?.srcObject;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
    }

    startScanner();

    return () => stopScanner();
  }, [onScan, onClose]);

  const handleManualSubmit = () => {
    if (manualCode.trim() !== "") {
      onScan(manualCode.trim());
      onClose();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <video
        ref={videoRef}
        className="rounded-lg shadow-lg border border-gray-600"
        style={{ width: "100%", maxWidth: "400px" }}
        autoPlay
        muted
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex flex-col space-y-2 w-full max-w-xs">
        <input
          type="text"
          placeholder="Enter code manually"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          className="w-full py-2 bg-white border-2 border-[var(--theme-color-primary)] rounded-full pl-6 pr-28 md:pr-32 text-base font-medium focus:outline-none shadow-sm"
        />
        <button
          onClick={handleManualSubmit}
          className="px-4 py-2 bg-[var(--theme-color-primary)] hover:bg-[var(--theme-color-secondary)] rounded-full text-white font-semibold cursor-pointer transition-colors"
        >
          Submit
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-stone-600 hover:bg-stone-500 rounded-full text-white font-semibold cursor-pointer transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
