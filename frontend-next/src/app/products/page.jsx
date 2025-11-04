"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchAllProducts } from "@/api/productApi";
import ProductList from "@/components/ProductList";
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
    <div className="container px-4 lg:px-10 py-4 mx-auto min-h-screen">
      {loading && (
        <div>
          <div className="w-full py-2 flex gap-6 items-center">
            <div onClick={() => router.push("/")} className="hidden md:block">
              <h1 className="text-3xl font-bold cursor-pointer text-[var(--theme-color-primary)]">
                Impactly
              </h1>
            </div>
            <div className="w-full">
              <ProductSeach
                initialInput={
                  searchParams.get("query") || searchParams.get("upc")
                }
              />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-color-primary)]"></div>
            <p className="mt-8 font-semibold text-[var(--theme-color-primary)] text-2xl">
              Loading products...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div>
          <div className="w-full py-2 flex gap-6 items-center">
            <div onClick={() => router.push("/")} className="hidden md:block">
              <h1 className="text-3xl font-bold cursor-pointer text-[var(--theme-color-primary)]">
                Impactly
              </h1>
            </div>
            <div className="w-full">
              <ProductSeach
                initialInput={
                  searchParams.get("query") || searchParams.get("upc")
                }
              />
            </div>
          </div>
          <h2 className="mt-36 font-semibold text-[var(--theme-color-primary)] text-3xl text-center">
            Sorry, no products found :(
          </h2>
          <p className="text-center text-[var(--theme-color-primary)] text-lg mt-4">
            Try again with a different search term.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="w-full py-2 flex gap-6 items-center">
            <div onClick={() => router.push("/")} className="hidden md:block">
              <h1 className="text-3xl font-bold cursor-pointer text-[var(--theme-color-primary)]">
                Impactly
              </h1>
            </div>
            <div className="w-full">
              <ProductSeach
                initialInput={
                  searchParams.get("query") || searchParams.get("upc")
                }
              />
            </div>
          </div>
          <h2 className="text-lg font-semibold my-4 text-[var(--theme-color-primary)] md:text-xl">
            Search results for "
            {searchParams.get("query") || searchParams.get("upc")}":
          </h2>
          {Array.isArray(product) ? (
            <>
              <ProductList products={product} />
            </>
          ) : product ? (
            <ProductList products={[product]} />
          ) : null}
        </>
      )}
    </div>
  );
}
