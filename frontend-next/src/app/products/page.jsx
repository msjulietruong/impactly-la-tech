import InputBox from "@/components/Input";
import ProductList from "@/components/ProductList";

export default function Products() {
  return (
    <div className="container px-4 lg:px-10 py-4">
      {/* <div className="sticky top-0 z-10  py-2"> */}
      <div className="py-2">
        <InputBox placeholder="Search products" />
      </div>
      <ProductList />
    </div>
  );
}
