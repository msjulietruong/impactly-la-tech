"use client";

import ProductSeach from "./ProductSeach";

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box rounded-xl bg-[var(--theme-color-background)]">
        <h3 className="font-bold text-2xl text-[var(--theme-color-primary)]">
          {title}
        </h3>
        <div className="py-4">{children}</div>
        {/* <div className="modal-action">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div> */}
      </div>
    </dialog>
  );
}
