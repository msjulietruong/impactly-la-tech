import { Suspense } from "react";
import ProductsClient from "@/components/ProductClient";

export const dynamic = "force-dynamic"; // avoid static prerendering problems on this route

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container px-4 lg:px-10 py-4 mx-auto min-h-screen">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-color-primary)]" />
            <p className="mt-8 font-semibold text-[var(--theme-color-primary)] text-2xl">
              Loading products...
            </p>
          </div>
        </div>
      }
    >
      <ProductsClient />
    </Suspense>
  );
}
