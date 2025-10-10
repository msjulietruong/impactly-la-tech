import InputBox from "@/components/Input";
import ProductList from "@/components/ProductList";

export default function Products() {
  return (
    <div className="container px-4 lg:px-10 py-4 mx-auto">
      {/* <div className="sticky top-0 z-10  py-2"> */}
      <div className="py-2">
        <InputBox placeholder="Search products" />
      </div>
      <h2 className="text-lg font-semibold my-4 text-[var(--theme-color-primary)] md:text-xl">
        Search results for "product":
      </h2>
      <ProductList />
    </div>
  );
}
