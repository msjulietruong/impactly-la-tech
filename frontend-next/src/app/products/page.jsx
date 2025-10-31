"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchAllProducts } from "@/api/productApi";
import ProductDetails from "@/components/ProductDetails";
import ESGScore from "@/components/ESGScore";
import Button from "@/components/Button";
import ProductList from "@/components/ProductList";
import Input from "@/components/Input";
import ProductSeach from "@/components/ProductSeach";
export default function Products() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = searchParams.get("query");
        const upc = searchParams.get("upc");

        if (!query && !upc) {
          setError("No search query or UPC provided");
          return;
        }

        const result = await fetchAllProducts(upc || query);
        setProduct(result);
      } catch (err) {
        setError(err.message || "Failed to fetch product");
        console.error("Product fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [searchParams]);

  console.log(product);

  return (
    <div className="container px-4 lg:px-10 py-4 mx-auto">
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading products...</p>
        </div>
      )}

      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="py-2">
            <ProductSeach
              initialInput={
                searchParams.get("query") || searchParams.get("upc")
              }
            />
          </div>
          <h2 className="text-lg font-semibold my-4 text-[var(--theme-color-primary)] md:text-xl">
            Search results for "
            {searchParams.get("query") || searchParams.get("upc")}":
          </h2>
          {Array.isArray(product) ? (
            <>
              <h2 className="text-lg font-semibold my-4 text-[var(--theme-color-primary)] md:text-xl">
                Search results for "
                {searchParams.get("query") || searchParams.get("upc")}":
              </h2>
              <ProductList products={product} />
            </>
          ) : product ? (
            <div className="space-y-6">
              <ProductDetails product={product} />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
