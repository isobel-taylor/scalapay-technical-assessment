import "dotenv/config";
import type { ProductAttributes } from "../src/products/product.model.js";

const PORT = process.env.PORT ?? 3000;

const fetchPage = async (
    page: number,
    pageSize: number,
): Promise<ProductAttributes[]> => {
    const response = await fetch(
        `http://localhost:${PORT}/products?page=${page}&pageSize=${pageSize}`,
    );

    if (!response.ok) {
        throw new Error(
            `Responded with ${response.status}, message: ${await response.text()}`,
        );
    }

    return await response.json();
};

const fetchFromPage = async (
    page: number,
    pageSize: number,
): Promise<ProductAttributes[]> => {
    const products = await fetchPage(page, pageSize);

    if (products.length === 0) {
        return products;
    }

    return [...products, ...(await fetchFromPage(page + 1, pageSize))];
};

const run = async () => {
    const allProducts = await fetchFromPage(1, 5);
    console.log(JSON.stringify(allProducts, null, 4));
};

run();
