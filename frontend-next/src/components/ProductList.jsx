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

export default function ProductList({ products = [] }) {
  const score_color = (score) => {
    if (score > 80) return "#A4B782"; // Green
    if (score > 50) return "#E3C271"; // Amber
    return "#BE5D5D"; // Red
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No products found</div>
    );
  }

  return (
    <div>
      <ul>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:gap-4 items-stretch">
          {products.map((item, index) => {
            // Normalize fields from different data shapes (demo data vs API data)
            const img =
              item.img || item.imageUrl || item.image_url || "/file.svg";
            const name =
              item.name || item.product_name || item.title || "Unknown Product";
            // Prefer explicit brand field, then fallback to company resolution or a string
            const companyName =
              item.brand ||
              (item.company &&
                (item.company.company_name || item.company.name)) ||
              (typeof item.company === "string"
                ? item.company
                : "Unknown Company");

            // Score may not exist in API responses; try several fields and coerce to number
            const rawScore =
              item.score ??
              item.environmental_score ??
              item.total_score ??
              null;
            const score =
              typeof rawScore === "number" ? rawScore : parseInt(rawScore, 10);
            const displayScore = Number.isFinite(score) ? score : null;

            return (
              <li key={index}>
                <div className="border-[var(--theme-color-tertiary)]/20 border-2 rounded-2xl p-4 flex flex-col justify-between h-full my-2 bg-[#f9f9f9]/50 md:p-6">
                  <img
                    src={img}
                    alt={name}
                    className="w-20 h-20 rounded-2xl my-auto md:w-32 md:h-32 md:mx-auto md:py-2 object-cover"
                  />
                  <div className="ml-6 my-auto md:pt-4 md:ml-0">
                    <h4 className="text-xs  text-[var(--theme-color-secondary)] font-medium md:text-sm">
                      {companyName}
                    </h4>
                    <h3 className="text-md text-[var(--theme-color-primary)] font-semibold md:text-lg">
                      {name}
                    </h3>
                    {displayScore !== null ? (
                      <h4
                        className="text-xs text-white font-semibold rounded-2xl py-1 px-2 my-1 md:text-base md:py-2"
                        style={{ backgroundColor: score_color(displayScore) }}
                      >
                        Score: {displayScore}/100
                      </h4>
                    ) : (
                      <h4
                        className="text-xs text-white font-semibold rounded-2xl py-1 px-2 my-1 md:text-base md:py-2"
                        style={{ backgroundColor: "#9CA3AF" }}
                      >
                        Score: N/A
                      </h4>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </div>
      </ul>
    </div>
  );
}
