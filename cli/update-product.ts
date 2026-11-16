import "dotenv/config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { ProductAttributes } from "../src/products/product.model.js";

const PORT = process.env.PORT ?? 3000;

interface UpdateProductBody {
    name?: string;
    price?: number;
    stock?: number;
}

const updateProduct = async (
    id: number,
    body: UpdateProductBody,
): Promise<ProductAttributes> => {
    const response = await fetch(`http://localhost:${PORT}/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(
            `Responded with ${response.status}, message: ${await response.text()}`,
        );
    }

    return await response.json();
};

const run = async () => {
    const argv = await yargs(hideBin(process.argv))
        .usage(
            "Usage: $0 --id <id> [--name <name>] [--price <price>] [--stock <stock>]",
        )
        .option("id", {
            type: "number",
            demandOption: true,
            describe: "ID of the product to update",
        })
        .option("name", {
            type: "string",
            describe: "New name of the product",
        })
        .option("price", {
            type: "number",
            describe: "New price of the product, up to 2 decimal places",
        })
        .option("stock", {
            type: "number",
            describe: "New number of units in stock",
        })
        .check((args) => {
            if (
                args.name === undefined &&
                args.price === undefined &&
                args.stock === undefined
            ) {
                throw new Error(
                    "Provide at least one of --name, --price or --stock",
                );
            }

            return true;
        })
        .strict()
        .parse();

    const result = await updateProduct(argv.id, {
        name: argv.name,
        price: argv.price,
        stock: argv.stock,
    });
    console.log(JSON.stringify(result, null, 4));
};

run();
