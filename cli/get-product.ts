import "dotenv/config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { ProductAttributes } from "../src/products/product.model.js";

const PORT = process.env.PORT ?? 3000;

const fetchProduct = async (id: number): Promise<ProductAttributes> => {
    const response = await fetch(`http://localhost:${PORT}/products/${id}`);

    if (!response.ok) {
        throw new Error(
            `Responded with ${response.status}, message: ${await response.text()}`,
        );
    }

    return await response.json();
};

const run = async () => {
    const argv = await yargs(hideBin(process.argv))
        .usage("Usage: $0 --id <id>")
        .option("id", {
            type: "number",
            demandOption: true,
            describe: "ID of the product to fetch",
        })
        .strict()
        .parse();

    const product = await fetchProduct(argv.id);
    console.log(JSON.stringify(product, null, 4));
};

run();
