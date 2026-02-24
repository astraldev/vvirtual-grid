export interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
}

export function generateMockItems(count: number): Product[] {
  const categories = ["Mens", "Womens", "Accessories", "Footwear"];
  return Array.from({ length: count }, (_, i) => ({
    id: crypto.randomUUID(),
    name: `Product ${i + 1}`,
    price: (Math.random() * 100 + 10).toFixed(2),
    image: `https://picsum.photos/seed/${i + 1}/400/600`,
    category: categories[i % categories.length] as string,
  }));
}

export const createPageProvider = (totalLength: number) => {
  const allItems = generateMockItems(totalLength);

  return async (pageNumber: number, pageSize: number): Promise<Product[]> => {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 300));

    const start = pageNumber * pageSize;
    const end = Math.min(start + pageSize, totalLength);

    if (start >= totalLength) return [];

    return allItems.slice(start, end);
  };
};
