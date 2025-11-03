"use client";

export default function InputBox({ value, onChange, placeholder }) {
  return (
    <div className="form-control w-full max-w-md">
      {/* <label className="label">
        <span className="label-text">Search a product:</span>
      </label> */}
      <input
        type="text"
        placeholder={placeholder || "Product name or barcode"}
        className="input input-bordered w-full rounded-lg"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
