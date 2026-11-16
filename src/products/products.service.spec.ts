import { HttpException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { UniqueConstraintError } from "sequelize";
import { PRODUCTS_REPOSITORY } from "./products.constants.js";
import { ProductsService } from "./products.service.js";

// The Product model is injected, so these tests provide a mock repository in
// its place and no database connection is made. Behaviour against a real
// database is covered by the e2e suite.
describe("ProductsService", () => {
    let service: ProductsService;
    let products: {
        findAndCountAll: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        findByPk: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        destroy: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        products = {
            findAndCountAll: vi.fn(),
            create: vi.fn(),
            findByPk: vi.fn(),
            update: vi.fn(),
            destroy: vi.fn(),
        };

        const moduleRef = await Test.createTestingModule({
            providers: [
                ProductsService,
                { provide: PRODUCTS_REPOSITORY, useValue: products },
            ],
        }).compile();

        service = moduleRef.get(ProductsService);
    });

    const expectNotFound = async (promise: Promise<unknown>) => {
        const error: unknown = await promise.catch((e: unknown) => e);
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(404);
        expect((error as HttpException).message).toBe("Product not found");
    };

    describe("findAll", () => {
        it("returns the page of products and the total count", async () => {
            const rows = [{ id: 1 }, { id: 2 }];
            products.findAndCountAll.mockResolvedValue({ rows, count: 30 });

            await expect(service.findAll(1, 25)).resolves.toEqual({
                products: rows,
                total: 30,
            });
        });

        it("returns the total even when the page is past the end", async () => {
            products.findAndCountAll.mockResolvedValue({ rows: [], count: 3 });

            await expect(service.findAll(5, 25)).resolves.toEqual({
                products: [],
                total: 3,
            });
        });

        it.each([
            { page: 1, pageSize: 25, offset: 0 },
            { page: 2, pageSize: 25, offset: 25 },
            { page: 3, pageSize: 10, offset: 20 },
            { page: 1, pageSize: 100, offset: 0 },
        ])(
            "orders by id and requests page $page of size $pageSize from offset $offset",
            async ({ page, pageSize, offset }) => {
                products.findAndCountAll.mockResolvedValue({
                    rows: [],
                    count: 0,
                });

                await service.findAll(page, pageSize);

                expect(products.findAndCountAll).toHaveBeenCalledWith({
                    order: [["id", "asc"]],
                    limit: pageSize,
                    offset,
                });
            },
        );
    });

    describe("create", () => {
        it("creates the product and returns the generated id", async () => {
            products.create.mockResolvedValue({ dataValues: { id: 7 } });

            await expect(
                service.create({
                    productToken: "widget-001",
                    name: "Widget",
                    price: 9.99,
                    stock: 3,
                }),
            ).resolves.toBe(7);
            expect(products.create).toHaveBeenCalledWith({
                productToken: "widget-001",
                name: "Widget",
                price: "9.99",
                stock: 3,
            });
        });

        it("throws a 409 when the product token is already in use", async () => {
            products.create.mockRejectedValue(new UniqueConstraintError({}));

            const error: unknown = await service
                .create({ productToken: "taken", name: "Widget", price: 1 })
                .catch((e: unknown) => e);

            expect(error).toBeInstanceOf(HttpException);
            expect((error as HttpException).getStatus()).toBe(409);
            expect((error as HttpException).message).toBe(
                "A product with this productToken already exists",
            );
        });

        it("rethrows other database errors unchanged", async () => {
            const failure = new Error("connection lost");
            products.create.mockRejectedValue(failure);

            await expect(
                service.create({ productToken: "t", name: "Widget", price: 1 }),
            ).rejects.toBe(failure);
        });

        it.each([
            [10, "10.00"],
            [0, "0.00"],
            [20.5, "20.50"],
            [99_999_999.99, "99999999.99"],
        ])(
            "stores price %d as the decimal string %s",
            async (price, stored) => {
                products.create.mockResolvedValue({ dataValues: { id: 1 } });

                await service.create({
                    productToken: "widget-001",
                    name: "Widget",
                    price,
                });

                expect(products.create).toHaveBeenCalledWith({
                    productToken: "widget-001",
                    name: "Widget",
                    price: stored,
                });
            },
        );
    });

    describe("findOne", () => {
        it("returns the product when it exists", async () => {
            const product = { id: 1, name: "Widget" };
            products.findByPk.mockResolvedValue(product);

            await expect(service.findOne(1)).resolves.toBe(product);
            expect(products.findByPk).toHaveBeenCalledWith(1);
        });

        it("throws a 404 when the product does not exist", async () => {
            products.findByPk.mockResolvedValue(null);

            await expectNotFound(service.findOne(99));
        });
    });

    describe("update", () => {
        it("updates the product by id without an extra lookup when a row changed", async () => {
            products.update.mockResolvedValue([1]);
            const body = { stock: 7 };

            await expect(service.update(1, body)).resolves.toBeUndefined();
            expect(products.update).toHaveBeenCalledWith(body, {
                where: { id: 1 },
            });
            expect(products.findByPk).not.toHaveBeenCalled();
        });

        it("converts an updated price to a decimal string", async () => {
            products.update.mockResolvedValue([1]);

            await service.update(1, { name: "Renamed", price: 20.5 });

            expect(products.update).toHaveBeenCalledWith(
                { name: "Renamed", price: "20.50" },
                { where: { id: 1 } },
            );
        });

        it("does not set price when it is not being updated", async () => {
            products.update.mockResolvedValue([1]);

            await service.update(1, { stock: 7 });

            expect(products.update.mock.calls[0][0]).not.toHaveProperty(
                "price",
            );
        });

        it("succeeds when no row changed but the product exists", async () => {
            products.update.mockResolvedValue([0]);
            products.findByPk.mockResolvedValue({ id: 1 });

            await expect(
                service.update(1, { stock: 7 }),
            ).resolves.toBeUndefined();
            expect(products.findByPk).toHaveBeenCalledWith(1);
        });

        it("throws a 404 when no row changed and the product does not exist", async () => {
            products.update.mockResolvedValue([0]);
            products.findByPk.mockResolvedValue(null);

            await expectNotFound(service.update(99, { stock: 7 }));
        });
    });

    describe("delete", () => {
        it("deletes the product by id", async () => {
            products.destroy.mockResolvedValue(1);

            await expect(service.delete(1)).resolves.toBeUndefined();
            expect(products.destroy).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        it("throws a 404 when the product does not exist", async () => {
            products.destroy.mockResolvedValue(0);

            await expectNotFound(service.delete(99));
        });
    });
});
