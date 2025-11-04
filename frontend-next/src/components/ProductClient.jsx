"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchAllProducts } from "@/api/productApi";
import ProductList from "@/components/ProductList";
import ProductSearch from "@/components/ProductSeach";

export default function ProductsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = searchParams.get("query");
        const upc = searchParams.get("upc");

        if (!query && !upc) {
          // No input provided — render the header + search bar, but not an error state that breaks builds
          if (!cancelled) {
            setProduct(null);
            setError(null);
          }
          return;
        }

        const result = await fetchAllProducts(upc || query);
        if (!cancelled) setProduct(result ?? null);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to fetch product");
        console.error("Product fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      cancelled = true;
    };
    // using toString() ensures the effect re-runs when params actually change
  }, [searchParams.toString()]);

  const initialInput =
    searchParams.get("query") || searchParams.get("upc") || "";

  return (
    <div className="container px-4 lg:px-10 py-4 mx-auto min-h-screen">
      {/* Header + search always shown */}
      <div className="w-full py-2 flex gap-6 items-center">
        <div onClick={() => router.push("/")} className="hidden md:block">
          <h1 className="text-3xl font-bold cursor-pointer text-[var(--theme-color-primary)]">
            Impactly
          </h1>
        </div>
        <div className="w-full">
          <ProductSearch initialInput={initialInput} />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-color-primary)]" />
          <p className="mt-8 font-semibold text-[var(--theme-color-primary)] text-2xl">
            Loading products...
          </p>
        </div>
      )}

      {/* Idle (no params) */}
      {!loading && !error && !initialInput && (
        <p className="text-center text-[var(--theme-color-primary)] mt-16">
          Enter a product name or UPC to search.
        </p>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-36">
          <h2 className="font-semibold text-[var(--theme-color-primary)] text-3xl text-center">
            Sorry, no products found :(
          </h2>
          <p className="text-center text-[var(--theme-color-primary)] text-lg mt-4">
            Try again with a different search term.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && initialInput && (
        <>
          <h2 className="text-lg font-semibold my-4 text-[var(--theme-color-primary)] md:text-xl">
            Search results for “{initialInput}”:
          </h2>

          {Array.isArray(product) ? (
            <ProductList products={product} />
          ) : product ? (
            <ProductList products={[product]} />
          ) : (
            <p className="text-[var(--theme-color-primary)]">No results.</p>
          )}
        </>
      )}
    </div>
  );
}
