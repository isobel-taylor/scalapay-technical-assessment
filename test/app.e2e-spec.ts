import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { Sequelize } from "sequelize";
import request from "supertest";
import { App } from "supertest/types.js";
import { AppModule } from "./../src/app.module.js";
import { SEQUELIZE } from "./../src/database/database.constants.js";
import { createSequelize } from "./../src/database/database.providers.js";
import { createMigrator } from "./../src/database/migrator.js";
import { ProductRepository } from "./../src/products/product.model.js";
import { PRODUCTS_REPOSITORY } from "./../src/products/products.constants.js";
import { createValidationPipe } from "./../src/validation.js";

// Runs against a real MySQL database (see vitest.config.e2e.ts and
// test/global-setup.ts). Start it with `docker compose up -d` first.
describe("Products API (e2e)", () => {
    let app: INestApplication<App>;
    let sequelize: Sequelize;
    /** The app's own Product model, for setting up and inspecting rows. */
    let Product: ProductRepository;

    const api = () => request(app.getHttpServer());

    let tokenCounter = 0;
    /** Returns a product token not used by any other product in the run. */
    const nextToken = () => `token-${++tokenCounter}`;

    /**
     * Creates a product through the API and returns its id. A unique product
     * token is generated when the body does not supply one.
     */
    const createProduct = async (
        body: {
            productToken?: string;
            name: string;
            price: number;
            stock?: number;
        } = {
            name: "Widget",
            price: 9.99,
            stock: 3,
        },
    ): Promise<{ id: number }> => {
        const response = await api()
            .post("/products")
            .send({ productToken: nextToken(), ...body })
            .expect(201)
            .expect("Content-Type", /application\/json/);
        return response.body as { id: number };
    };

    const notFound = { statusCode: 404, message: "Product not found" };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            // The app's own connection settings, minus per-query SQL logging.
            .overrideProvider(SEQUELIZE)
            .useFactory({ factory: () => createSequelize({ logging: false }) })
            .compile();

        sequelize = moduleFixture.get<Sequelize>(SEQUELIZE);
        Product = moduleFixture.get<ProductRepository>(PRODUCTS_REPOSITORY);

        if (!sequelize.getDatabaseName().endsWith("_test")) {
            throw new Error("e2e tests must run against a *_test database");
        }
        // Build the schema with the real migrations, from an empty database,
        // so the tests run against exactly what production would have.
        await sequelize.getQueryInterface().dropAllTables();
        await createMigrator(sequelize, undefined).up();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(createValidationPipe());
        await app.init();
    });

    beforeEach(async () => {
        // TRUNCATE also resets AUTO_INCREMENT, so ids are predictable.
        await Product.truncate();
    });

    afterAll(async () => {
        // Closing the app also closes the database connection, via
        // DatabaseModule's shutdown hook.
        await app.close();
    });

    describe("POST /products", () => {
        it("creates a product and returns its id", async () => {
            const response = await api()
                .post("/products")
                .send({
                    productToken: "widget-001",
                    name: "Widget",
                    price: 9.99,
                    stock: 3,
                })
                .expect(201)
                .expect("Content-Type", /application\/json/);

            expect(response.body).toStrictEqual({ id: 1 });

            const stored = await Product.findByPk(1);
            expect(stored?.get()).toMatchObject({
                id: 1,
                productToken: "widget-001",
                name: "Widget",
                price: "9.99",
                stock: 3,
            });
        });

        it("defaults stock to 0", async () => {
            const id = (await createProduct({ name: "Gadget", price: 10 })).id;

            const response = await api().get(`/products/${id}`).expect(200);
            expect(response.body).toMatchObject({ stock: 0 });
        });

        it("returns 409 for a product token that is already in use", async () => {
            await createProduct({
                productToken: "widget-001",
                name: "Widget",
                price: 1,
            });

            await api()
                .post("/products")
                .send({ productToken: "widget-001", name: "Other", price: 2 })
                .expect(409)
                .expect({
                    statusCode: 409,
                    message: "A product with this productToken already exists",
                });
            expect(await Product.count()).toBe(1);
        });

        it("allows a product token to be reused once its product is deleted", async () => {
            const { id } = await createProduct({
                productToken: "widget-001",
                name: "Widget",
                price: 1,
            });
            await api().delete(`/products/${id}`).expect(200);

            await createProduct({
                productToken: "widget-001",
                name: "Widget",
                price: 1,
            });
        });

        it("stores a 255 code point product token", async () => {
            const productToken = "😀".repeat(255);

            const { id } = await createProduct({
                productToken,
                name: "Widget",
                price: 1,
            });

            const response = await api().get(`/products/${id}`).expect(200);
            expect(response.body.productToken).toBe(productToken);
        });

        it("rejects a product token over 255 code points", async () => {
            const response = await api()
                .post("/products")
                .send({
                    productToken: "a".repeat(256),
                    name: "Widget",
                    price: 1,
                })
                .expect(400);

            expect(response.body.message).toEqual({
                productToken: [
                    "productToken must be shorter than or equal to 255 characters",
                ],
            });
            expect(await Product.count()).toBe(0);
        });

        it("returns grouped validation errors for an invalid body", async () => {
            const response = await api()
                .post("/products")
                .send({
                    productToken: nextToken(),
                    name: "",
                    price: -1,
                    stock: 1.5,
                    extra: true,
                })
                .expect(400);

            expect(response.body).toEqual({
                statusCode: 400,
                error: "Bad Request",
                message: {
                    name: ["name should not be empty"],
                    price: ["price must not be less than 0"],
                    stock: ["stock must be an integer number"],
                    extra: ["property extra should not exist"],
                },
            });
            expect(await Product.count()).toBe(0);
        });

        it("rejects a body missing required fields", async () => {
            const response = await api().post("/products").send({}).expect(400);

            expect(Object.keys(response.body.message).sort()).toEqual([
                "name",
                "price",
                "productToken",
            ]);
        });
    });

    describe("GET /products", () => {
        it("returns an empty list when there are no products", async () => {
            await api().get("/products").expect(200).expect([]);
        });

        it("returns all product fields", async () => {
            await createProduct({ name: "Widget", price: 9.99, stock: 3 });

            const response = await api().get("/products").expect(200);

            expect(response.body).toEqual([
                {
                    id: 1,
                    productToken: expect.any(String),
                    name: "Widget",
                    price: "9.99",
                    stock: 3,
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                },
            ]);
        });

        it("returns products ordered by id", async () => {
            for (const name of ["C", "A", "B"]) {
                await createProduct({ name, price: 1 });
            }

            const response = await api().get("/products").expect(200);

            expect(response.body.map((p: { id: number }) => p.id)).toEqual([
                1, 2, 3,
            ]);
        });

        describe("pagination", () => {
            const ids = (body: { id: number }[]) => body.map((p) => p.id);

            beforeEach(async () => {
                await Product.bulkCreate(
                    Array.from({ length: 30 }, (_, i) => ({
                        productToken: nextToken(),
                        name: `Product ${i + 1}`,
                        price: `${i + 1}.00`,
                    })),
                );
            });

            it("returns the first 25 products by default", async () => {
                const response = await api().get("/products").expect(200);

                expect(ids(response.body)).toEqual(
                    Array.from({ length: 25 }, (_, i) => i + 1),
                );
            });

            it("returns the remainder on the last page", async () => {
                const response = await api()
                    .get("/products?page=2")
                    .expect(200);

                expect(ids(response.body)).toEqual([26, 27, 28, 29, 30]);
            });

            it("honours page and pageSize together", async () => {
                const response = await api()
                    .get("/products?page=3&pageSize=4")
                    .expect(200);

                expect(ids(response.body)).toEqual([9, 10, 11, 12]);
            });

            it("returns an empty list for a page past the end", async () => {
                await api().get("/products?page=100").expect(200).expect([]);
            });

            it.each([
                ["page=0", "page"],
                ["page=abc", "page"],
                ["pageSize=0", "pageSize"],
                ["pageSize=101", "pageSize"],
                ["sort=name", "sort"],
            ])("rejects ?%s", async (query, field) => {
                const response = await api()
                    .get(`/products?${query}`)
                    .expect(400);

                expect(Object.keys(response.body.message)).toEqual([field]);
            });
        });
    });

    describe("GET /products/:id", () => {
        it("returns the product", async () => {
            const id = (
                await createProduct({
                    name: "Widget",
                    price: 9.99,
                    stock: 3,
                })
            ).id;

            const response = await api().get(`/products/${id}`).expect(200);

            expect(response.body).toMatchObject({
                id,
                name: "Widget",
                price: "9.99",
                stock: 3,
            });
        });

        it("returns 404 for a product that does not exist", async () => {
            await api().get("/products/999").expect(404).expect(notFound);
        });

        it.each(["0", "-1", "1.5", "abc"])(
            "returns 400 for invalid id %s",
            async (id) => {
                const response = await api().get(`/products/${id}`).expect(400);

                expect(Object.keys(response.body.message)).toEqual(["id"]);
            },
        );
    });

    describe("POST /products/:id", () => {
        it("updates the stock of a product", async () => {
            const id = (
                await createProduct({
                    name: "Widget",
                    price: 9.99,
                    stock: 3,
                })
            ).id;

            await api()
                .post(`/products/${id}`)
                .send({ stock: 7 })
                .expect(201)
                .expect("Content-Type", /application\/json/)
                .expect({ id });

            const response = await api().get(`/products/${id}`).expect(200);
            expect(response.body).toMatchObject({
                name: "Widget",
                price: "9.99",
                stock: 7,
            });
        });

        it("updates several fields at once", async () => {
            const id = (await createProduct()).id;

            await api()
                .post(`/products/${id}`)
                .send({ name: "Renamed", price: 20.5, stock: 0 })
                .expect(201);

            const response = await api().get(`/products/${id}`).expect(200);
            expect(response.body).toMatchObject({
                name: "Renamed",
                price: "20.50",
                stock: 0,
            });
        });

        it("only changes the targeted product", async () => {
            const first = await createProduct({
                name: "A",
                price: 1,
                stock: 1,
            });
            const second = await createProduct({
                name: "B",
                price: 2,
                stock: 2,
            });

            await api()
                .post(`/products/${first.id}`)
                .send({ stock: 9 })
                .expect(201);

            const response = await api()
                .get(`/products/${second.id}`)
                .expect(200);
            expect(response.body).toMatchObject({ stock: 2 });
        });

        it("succeeds when the update does not change anything", async () => {
            const response = await createProduct({
                name: "Widget",
                price: 9.99,
                stock: 3,
            });

            await api()
                .post(`/products/${response.id}`)
                .send({ stock: 3 })
                .expect(201)
                .expect({ id: response.id });
            await api()
                .post(`/products/${response.id}`)
                .send({})
                .expect(201)
                .expect({ id: response.id });
        });

        it("returns 404 for a product that does not exist", async () => {
            await api()
                .post("/products/999")
                .send({ stock: 1 })
                .expect(404)
                .expect(notFound);
        });

        it("returns 404 for a no-op update of a product that does not exist", async () => {
            await api()
                .post("/products/999")
                .send({})
                .expect(404)
                .expect(notFound);
        });

        it("rejects an invalid body without changing the product", async () => {
            const id = (
                await createProduct({
                    name: "Widget",
                    price: 9.99,
                    stock: 3,
                })
            ).id;

            const response = await api()
                .post(`/products/${id}`)
                .send({ stock: -1, productToken: "abc" })
                .expect(400);

            expect(Object.keys(response.body.message).sort()).toEqual([
                "productToken",
                "stock",
            ]);
            const stored = await api().get(`/products/${id}`).expect(200);
            expect(stored.body).toMatchObject({ stock: 3 });
        });

        it("returns 400 for an invalid id", async () => {
            const response = await api()
                .post("/products/abc")
                .send({ stock: 1 })
                .expect(400);

            expect(Object.keys(response.body.message)).toEqual(["id"]);
        });
    });

    // The name, price and stock limits keep input within the VARCHAR(255),
    // DECIMAL(10, 2) and BIGINT columns (stock is further capped at the largest
    // safe JavaScript integer), so out-of-range input is a 400 rather than a
    // database error.
    describe("column limits", () => {
        const maxName = "a".repeat(255);
        const tooLongName = "a".repeat(256);

        describe.each([
            ["POST /products", undefined],
            ["POST /products/:id", { name: "Widget", price: 1 }],
        ])("%s", (_, existing) => {
            /** Sends the body to create, or to update a fresh product. */
            const send = async (body: object) => {
                if (existing === undefined) {
                    return api()
                        .post("/products")
                        .send({
                            productToken: nextToken(),
                            name: "Widget",
                            price: 1,
                            ...body,
                        });
                }
                const { id } = await createProduct(existing);
                return api().post(`/products/${id}`).send(body);
            };

            it("stores a 255 character name", async () => {
                const response = await send({ name: maxName });
                expect(response.status).toBeLessThan(300);

                const stored = await api()
                    .get(`/products/${response.body.id}`)
                    .expect(200);
                expect(stored.body.name).toBe(maxName);
            });

            it.each([
                ["3-byte characters", "€".repeat(255)],
                ["4-byte emoji", "😀".repeat(255)],
                ["emoji with variation selectors", "❤️".repeat(127) + "a"],
            ])("stores a 255 code point name of %s", async (__, name) => {
                const response = await send({ name });
                expect(response.status).toBeLessThan(300);

                const stored = await api()
                    .get(`/products/${response.body.id}`)
                    .expect(200);
                expect(stored.body.name).toBe(name);
            });

            it("stores the maximum price exactly", async () => {
                const response = await send({ price: 99_999_999.99 });
                expect(response.status).toBeLessThan(300);

                const stored = await api()
                    .get(`/products/${response.body.id}`)
                    .expect(200);
                expect(stored.body.price).toBe("99999999.99");
            });

            it("stores the maximum stock exactly", async () => {
                const response = await send({ stock: Number.MAX_SAFE_INTEGER });
                expect(response.status).toBeLessThan(300);

                const stored = await api()
                    .get(`/products/${response.body.id}`)
                    .expect(200);
                expect(stored.body.stock).toBe(Number.MAX_SAFE_INTEGER);
            });

            it.each([
                [
                    "a 256 character name",
                    { name: tooLongName },
                    "name must be shorter than or equal to 255 characters",
                ],
                [
                    "a price above the maximum",
                    { price: 100_000_000 },
                    "price must not be greater than 99999999.99",
                ],
                [
                    "a very large price",
                    { price: 123_456_789_012 },
                    "price must not be greater than 99999999.99",
                ],
                [
                    "a price with 3 decimal places",
                    { price: 9.999 },
                    "price must be a number conforming to the specified constraints",
                ],
                [
                    "255 emoji with variation selectors (510 code points)",
                    { name: "❤️".repeat(255) },
                    "name must be shorter than or equal to 255 characters",
                ],
                [
                    "128 emoji with variation selectors (256 code points)",
                    { name: "❤️".repeat(128) },
                    "name must be shorter than or equal to 255 characters",
                ],
                [
                    "a stock above the maximum",
                    { stock: Number.MAX_SAFE_INTEGER + 1 },
                    "stock must not be greater than 9007199254740991",
                ],
                [
                    "a stock beyond the BIGINT range",
                    { stock: 1e20 },
                    "stock must not be greater than 9007199254740991",
                ],
            ])("rejects %s with a 400", async (__, body, message) => {
                const response = await send(body);

                expect(response.status).toBe(400);
                const [field] = Object.keys(body);
                expect(response.body.message[field]).toContain(message);
            });
        });

        it("does not store a product rejected for its limits", async () => {
            await api()
                .post("/products")
                .send({
                    productToken: nextToken(),
                    name: tooLongName,
                    price: 100_000_000,
                })
                .expect(400);

            expect(await Product.count()).toBe(0);
        });

        it("does not store a name that only fits when variation selectors are ignored", async () => {
            await api()
                .post("/products")
                .send({
                    productToken: nextToken(),
                    name: "❤️".repeat(255),
                    price: 1,
                })
                .expect(400);

            expect(await Product.count()).toBe(0);
        });

        it("does not change a product when an update is rejected", async () => {
            const { id } = await createProduct({ name: "Widget", price: 1 });

            await api()
                .post(`/products/${id}`)
                .send({ name: tooLongName, price: 9.999 })
                .expect(400);

            const stored = await api().get(`/products/${id}`).expect(200);
            expect(stored.body).toMatchObject({
                name: "Widget",
                price: "1.00",
            });
        });
    });

    describe("DELETE /products/:id", () => {
        it("deletes the product", async () => {
            const response = await createProduct();

            await api()
                .delete(`/products/${response.id}`)
                .expect(200)
                .expect("Content-Type", /application\/json/)
                .expect({ id: response.id });

            await api().get(`/products/${response.id}`).expect(404);
            expect(await Product.count()).toBe(0);
        });

        it("only deletes the targeted product", async () => {
            const first = await createProduct();
            const second = await createProduct();

            await api().delete(`/products/${first.id}`).expect(200);

            await api().get(`/products/${second.id}`).expect(200);
        });

        it("returns 404 for a product that does not exist", async () => {
            await api().delete("/products/999").expect(404).expect(notFound);
        });

        it("returns 404 when deleting the same product twice", async () => {
            const result = await createProduct();

            await api().delete(`/products/${result.id}`).expect(200);
            await api()
                .delete(`/products/${result.id}`)
                .expect(404)
                .expect(notFound);
        });

        it("returns 400 for an invalid id", async () => {
            const response = await api().delete("/products/0").expect(400);

            expect(response.body.message).toEqual({
                id: ["id must not be less than 1"],
            });
        });
    });
});
