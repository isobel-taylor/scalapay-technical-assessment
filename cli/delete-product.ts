import "dotenv/config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const PORT = process.env.PORT ?? 3000;

const deleteProduct = async (id: number): Promise<{ id: number }> => {
    const response = await fetch(`http://localhost:${PORT}/products/${id}`, {
        method: "DELETE",
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
        .usage("Usage: $0 --id <id>")
        .option("id", {
            type: "number",
            demandOption: true,
            describe: "ID of the product to delete",
        })
        .strict()
        .parse();

    const result = await deleteProduct(argv.id);
    console.log(JSON.stringify(result, null, 4));
};

run();
