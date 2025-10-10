const data = [
  {
    name: "Product 1",
    img: "/file.svg",
    score: 90,
    company: "Company 1",
  },
  {
    name: "Product 2",
    img: "/file.svg",
    score: 80,
    company: "Company 2",
  },
  {
    name: "Product 3",
    img: "/file.svg",
    score: 70,
    company: "Company 3",
  },
  {
    name: "Product 4",
    img: "/file.svg",
    score: 60,
    company: "Company 4",
  },
  {
    name: "Product 5",
    img: "/file.svg",
    score: 50,
    company: "Company 5",
  },
  {
    name: "Product 6",
    img: "/file.svg",
    score: 40,
    company: "Company 6",
  },
  {
    name: "Product 7",
    img: "/file.svg",
    score: 30,
    company: "Company 7",
  },
  {
    name: "Product 8",
    img: "/file.svg",
    score: 20,
    company: "Company 8",
  },
  {
    name: "Product 9",
    img: "/file.svg",
    score: 10,
    company: "Company 9",
  },
];

export default function ProductList() {
  const score_color = (score) => {
    if (score > 80) return "#A4B782"; // Green
    if (score > 50) return "#E3C271"; // Amber
    return "#BE5D5D"; // Red
  };
  return (
    <div>
      <ul>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {data.map((product, index) => (
            <li key={index}>
              <div className="border-[var(--theme-color-tertiary)]/20 border-2 rounded-2xl p-4 flex my-2 bg-[#f9f9f9]/50 md:p-6 md:flex-col ">
                <img
                  src={product.img}
                  alt={product.name}
                  className="w-20 h-20 rounded-2xl my-auto md:w-32 md:h-32 md:mx-auto md:py-2"
                />
                <div className="ml-6 my-auto md:pt-4 md:ml-0">
                  <h4 className="text-xs  text-[var(--theme-color-secondary)] font-medium md:text-sm">
                    {product.company}
                  </h4>
                  <h3 className="text-md text-[var(--theme-color-primary)] font-semibold md:text-lg">
                    {product.name}
                  </h3>
                  <h4
                    className="text-xs text-white font-semibold rounded-2xl py-1 px-2 my-1 md:text-base md:py-2"
                    style={{ backgroundColor: score_color(product.score) }}
                  >
                    Score: {product.score}/100
                  </h4>
                </div>
              </div>
            </li>
          ))}
        </div>
      </ul>
    </div>
  );
}
