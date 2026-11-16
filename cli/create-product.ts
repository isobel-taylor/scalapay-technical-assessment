import "dotenv/config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const PORT = process.env.PORT ?? 3000;

interface CreateProductBody {
    name: string;
    price: number;
    stock?: number;
}

const createProduct = async (
    body: CreateProductBody,
): Promise<{ id: number }> => {
    const response = await fetch(`http://localhost:${PORT}/products`, {
        method: "POST",
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
        .usage("Usage: $0 --name <name> --price <price> [--stock <stock>]")
        .option("name", {
            type: "string",
            demandOption: true,
            describe: "Name of the product",
        })
        .option("price", {
            type: "number",
            demandOption: true,
            describe: "Price of the product, up to 2 decimal places",
        })
        .option("stock", {
            type: "number",
            describe: "Units in stock",
        })
        .strict()
        .parse();

    const result = await createProduct({
        name: argv.name,
        price: argv.price,
        stock: argv.stock,
    });
    console.log(JSON.stringify(result, null, 4));
};

run();
