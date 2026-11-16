import { ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { createValidationPipe } from "../validation.js";
import { CreateProductDto } from "./create-product-dto.js";
import { DeleteProductDto } from "./delete-product-dto.js";
import { FindAllProductDto } from "./find-all-product-dto.js";
import { FindOneProductDto } from "./find-one-dto.js";
import {
    UpdateProductBodyDto,
    UpdateProductParamDto,
} from "./update-product-dto.js";

// Runs the DTOs through the same global ValidationPipe the app uses, so these
// tests cover both the decorators and the pipe configuration (whitelisting,
// type conversion and the grouped error format).
const pipe = createValidationPipe();

const validate = (
    metatype: ArgumentMetadata["metatype"],
    type: ArgumentMetadata["type"],
    value: unknown,
): Promise<unknown> =>
    pipe.transform(value, { metatype, type }) as Promise<unknown>;

/** Resolves to the grouped `{ field: messages[] }` validation errors. */
const validationErrors = async (
    promise: Promise<unknown>,
): Promise<Record<string, string[]>> => {
    const error: unknown = await promise.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BadRequestException);
    const response = (error as BadRequestException).getResponse() as {
        message: Record<string, string[]>;
    };
    return response.message;
};

describe("DTO validation", () => {
    describe("CreateProductDto", () => {
        const create = (body: unknown) =>
            validate(CreateProductDto, "body", body);

        it.each([
            { name: "Widget", price: 9.99, stock: 3 },
            { name: "Widget", price: 0, stock: 0 },
            { name: "Widget", price: 10 },
        ])("accepts a valid body %o", async (body) => {
            await expect(create(body)).resolves.toEqual(body);
        });

        it("requires name and price", async () => {
            const errors = await validationErrors(create({}));

            expect(Object.keys(errors).sort()).toEqual(["name", "price"]);
        });

        it.each([
            ["an empty name", { name: "", price: 1 }, "name"],
            ["a non-string name", { name: 123, price: 1 }, "name"],
            ["a negative price", { name: "Widget", price: -0.01 }, "price"],
            ["a string price", { name: "Widget", price: "5" }, "price"],
            [
                "a negative stock",
                { name: "Widget", price: 1, stock: -1 },
                "stock",
            ],
            [
                "a fractional stock",
                { name: "Widget", price: 1, stock: 1.5 },
                "stock",
            ],
            [
                "a string stock",
                { name: "Widget", price: 1, stock: "3" },
                "stock",
            ],
        ])("rejects %s", async (_, body, field) => {
            const errors = await validationErrors(create(body));

            expect(Object.keys(errors)).toEqual([field]);
            expect(errors[field].length).toBeGreaterThan(0);
        });

        it.each(["productToken", "id"])(
            "rejects the server-generated %s property",
            async (property) => {
                const errors = await validationErrors(
                    create({ name: "Widget", price: 1, [property]: "x" }),
                );

                expect(errors).toEqual({
                    [property]: [`property ${property} should not exist`],
                });
            },
        );

        it("groups multiple errors by property", async () => {
            const errors = await validationErrors(
                create({ name: "", price: -1, stock: 1.5, extra: true }),
            );

            expect(errors).toEqual({
                name: ["name should not be empty"],
                price: ["price must not be less than 0"],
                stock: ["stock must be an integer number"],
                extra: ["property extra should not exist"],
            });
        });
    });

    describe("UpdateProductBodyDto", () => {
        const update = (body: unknown) =>
            validate(UpdateProductBodyDto, "body", body);

        it.each([
            {},
            { stock: 7 },
            { name: "Renamed" },
            { price: 1.5 },
            { name: "Renamed", price: 0, stock: 0 },
        ])("accepts a valid partial body %o", async (body) => {
            await expect(update(body)).resolves.toEqual(body);
        });

        it.each([
            ["an empty name", { name: "" }, "name"],
            ["a negative price", { price: -1 }, "price"],
            ["a negative stock", { stock: -1 }, "stock"],
            ["a fractional stock", { stock: 0.5 }, "stock"],
            ["a productToken", { productToken: "x" }, "productToken"],
            ["an id", { id: 2 }, "id"],
        ])("rejects %s", async (_, body, field) => {
            const errors = await validationErrors(update(body));

            expect(Object.keys(errors)).toEqual([field]);
        });
    });

    // Limits that mirror the database columns: name is VARCHAR(255) and price
    // is DECIMAL(10, 2). Both create and update must enforce them.
    describe.each([
        ["CreateProductDto", CreateProductDto, { name: "Widget", price: 1 }],
        ["UpdateProductBodyDto", UpdateProductBodyDto, {}],
    ])("%s column limits", (_, dto, base) => {
        const body = (fields: object) =>
            validate(dto, "body", { ...base, ...fields });

        it.each([
            ["a 255 character name", { name: "a".repeat(255) }],
            ["a 255 character multi-byte name", { name: "é".repeat(255) }],
            ["a price of 0.01", { price: 0.01 }],
            ["a price with one decimal place", { price: 20.5 }],
            ["the maximum price 99999999.99", { price: 99_999_999.99 }],
        ])("accepts %s", async (__, fields) => {
            await expect(body(fields)).resolves.toEqual({
                ...base,
                ...fields,
            });
        });

        it("rejects a 256 character name", async () => {
            const errors = await validationErrors(
                body({ name: "a".repeat(256) }),
            );

            expect(errors).toEqual({
                name: ["name must be shorter than or equal to 255 characters"],
            });
        });

        it.each([100_000_000, 100_000_000.01, 1e12])(
            "rejects price %d above the maximum",
            async (price) => {
                const errors = await validationErrors(body({ price }));

                expect(errors.price).toContain(
                    "price must not be greater than 99999999.99",
                );
            },
        );

        it.each([9.999, 0.001, 1.005, 99_999_999.991])(
            "rejects price %d with more than 2 decimal places",
            async (price) => {
                const errors = await validationErrors(body({ price }));

                expect(Object.keys(errors)).toEqual(["price"]);
                expect(errors.price).toContain(
                    "price must be a number conforming to the specified constraints",
                );
            },
        );

        it("accepts the maximum stock", async () => {
            await expect(
                body({ stock: Number.MAX_SAFE_INTEGER }),
            ).resolves.toEqual({ ...base, stock: Number.MAX_SAFE_INTEGER });
        });

        it.each([Number.MAX_SAFE_INTEGER + 1, 2 ** 63, 1e20])(
            "rejects stock %d above the maximum",
            async (stock) => {
                const errors = await validationErrors(body({ stock }));

                expect(errors).toEqual({
                    stock: ["stock must not be greater than 9007199254740991"],
                });
            },
        );
    });

    describe.each([
        ["FindOneProductDto", FindOneProductDto],
        ["UpdateProductParamDto", UpdateProductParamDto],
        ["DeleteProductDto", DeleteProductDto],
    ])("%s (id path parameter)", (_, dto) => {
        const param = (value: unknown) => validate(dto, "param", value);

        it.each(["1", "42", "9007199254740991"])(
            "accepts and converts id %s to a number",
            async (id) => {
                await expect(param({ id })).resolves.toEqual({
                    id: Number(id),
                });
            },
        );

        it.each(["0", "-1", "1.5", "abc", ""])("rejects id %j", async (id) => {
            const errors = await validationErrors(param({ id }));

            expect(Object.keys(errors)).toEqual(["id"]);
        });
    });

    describe("FindAllProductDto", () => {
        const query = (value: unknown) =>
            validate(FindAllProductDto, "query", value);

        it("accepts an empty query", async () => {
            await expect(query({})).resolves.toEqual({});
        });

        it("converts page and pageSize to numbers", async () => {
            await expect(query({ page: "2", pageSize: "50" })).resolves.toEqual(
                { page: 2, pageSize: 50 },
            );
        });

        it.each(["1", "100"])("accepts pageSize %s", async (pageSize) => {
            await expect(query({ pageSize })).resolves.toEqual({
                pageSize: Number(pageSize),
            });
        });

        it.each([
            ["page 0", { page: "0" }, "page"],
            ["a fractional page", { page: "1.5" }, "page"],
            ["a non-numeric page", { page: "abc" }, "page"],
            ["pageSize 0", { pageSize: "0" }, "pageSize"],
            ["pageSize above 100", { pageSize: "101" }, "pageSize"],
            ["an unknown query parameter", { sort: "name" }, "sort"],
        ])("rejects %s", async (_, value, field) => {
            const errors = await validationErrors(query(value));

            expect(Object.keys(errors)).toEqual([field]);
        });
    });
});
