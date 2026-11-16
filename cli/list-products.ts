import "dotenv/config";
import type { ProductAttributes } from "../src/products/product.model.js";

const PORT = process.env.PORT ?? 3000;

interface ProductsPage {
    products: ProductAttributes[];
    total: number;
}

const fetchPage = async (
    page: number,
    pageSize: number,
): Promise<ProductsPage> => {
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

/**
 * Fetches every product, a page at a time, using the total from the API to
 * know when to stop. An empty page also stops the loop, in case products are
 * deleted while it runs and the total is no longer reachable.
 */
const fetchAll = async (pageSize: number): Promise<ProductAttributes[]> => {
    const allProducts: ProductAttributes[] = [];

    for (let page = 1; ; page++) {
        const { products, total } = await fetchPage(page, pageSize);
        allProducts.push(...products);

        if (products.length === 0 || allProducts.length >= total) {
            return allProducts;
        }
    }
};

const run = async () => {
    const allProducts = await fetchAll(5);
    console.log(JSON.stringify(allProducts, null, 4));
};

run();
