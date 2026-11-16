import { HttpException } from "@nestjs/common";
import { UniqueConstraintError } from "sequelize";
import { AppService } from "./app.service.js";
import { Product } from "./db/index.js";

// These tests stub the Sequelize model's static methods, so no database
// connection is made. Behaviour against a real database is covered by the
// e2e suite.
describe("AppService", () => {
    let service: AppService;

    beforeEach(() => {
        service = new AppService();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const expectNotFound = async (promise: Promise<unknown>) => {
        const error: unknown = await promise.catch((e: unknown) => e);
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(404);
        expect((error as HttpException).message).toBe("Product not found");
    };

    describe("findAll", () => {
        it("returns the products from the model", async () => {
            const rows = [{ id: 1 }, { id: 2 }];
            vi.spyOn(Product, "findAll").mockResolvedValue(rows as never);

            await expect(service.findAll(1, 25)).resolves.toBe(rows);
        });

        it.each([
            { page: 1, pageSize: 25, offset: 0 },
            { page: 2, pageSize: 25, offset: 25 },
            { page: 3, pageSize: 10, offset: 20 },
            { page: 1, pageSize: 100, offset: 0 },
        ])(
            "orders by id and requests page $page of size $pageSize from offset $offset",
            async ({ page, pageSize, offset }) => {
                const findAll = vi
                    .spyOn(Product, "findAll")
                    .mockResolvedValue([]);

                await service.findAll(page, pageSize);

                expect(findAll).toHaveBeenCalledWith({
                    order: [["id", "asc"]],
                    limit: pageSize,
                    offset,
                });
            },
        );
    });

    describe("create", () => {
        it("creates the product and returns the generated id", async () => {
            const create = vi
                .spyOn(Product, "create")
                .mockResolvedValue({ dataValues: { id: 7 } } as never);

            await expect(
                service.create({
                    productToken: "widget-001",
                    name: "Widget",
                    price: 9.99,
                    stock: 3,
                }),
            ).resolves.toBe(7);
            expect(create).toHaveBeenCalledWith({
                productToken: "widget-001",
                name: "Widget",
                price: "9.99",
                stock: 3,
            });
        });

        it("throws a 409 when the product token is already in use", async () => {
            vi.spyOn(Product, "create").mockRejectedValue(
                new UniqueConstraintError({}),
            );

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
            vi.spyOn(Product, "create").mockRejectedValue(failure);

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
                const create = vi
                    .spyOn(Product, "create")
                    .mockResolvedValue({ dataValues: { id: 1 } } as never);

                await service.create({
                    productToken: "widget-001",
                    name: "Widget",
                    price,
                });

                expect(create).toHaveBeenCalledWith({
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
            const findByPk = vi
                .spyOn(Product, "findByPk")
                .mockResolvedValue(product as never);

            await expect(service.findOne(1)).resolves.toBe(product);
            expect(findByPk).toHaveBeenCalledWith(1);
        });

        it("throws a 404 when the product does not exist", async () => {
            vi.spyOn(Product, "findByPk").mockResolvedValue(null);

            await expectNotFound(service.findOne(99));
        });
    });

    describe("update", () => {
        it("updates the product by id without an extra lookup when a row changed", async () => {
            const update = vi
                .spyOn(Product, "update")
                .mockResolvedValue([1] as never);
            const findByPk = vi.spyOn(Product, "findByPk");
            const body = { stock: 7 };

            await expect(service.update(1, body)).resolves.toBeUndefined();
            expect(update).toHaveBeenCalledWith(body, { where: { id: 1 } });
            expect(findByPk).not.toHaveBeenCalled();
        });

        it("converts an updated price to a decimal string", async () => {
            const update = vi
                .spyOn(Product, "update")
                .mockResolvedValue([1] as never);

            await service.update(1, { name: "Renamed", price: 20.5 });

            expect(update).toHaveBeenCalledWith(
                { name: "Renamed", price: "20.50" },
                { where: { id: 1 } },
            );
        });

        it("does not set price when it is not being updated", async () => {
            const update = vi
                .spyOn(Product, "update")
                .mockResolvedValue([1] as never);

            await service.update(1, { stock: 7 });

            expect(update.mock.calls[0][0]).not.toHaveProperty("price");
        });

        it("succeeds when no row changed but the product exists", async () => {
            vi.spyOn(Product, "update").mockResolvedValue([0] as never);
            const findByPk = vi
                .spyOn(Product, "findByPk")
                .mockResolvedValue({ id: 1 } as never);

            await expect(
                service.update(1, { stock: 7 }),
            ).resolves.toBeUndefined();
            expect(findByPk).toHaveBeenCalledWith(1);
        });

        it("throws a 404 when no row changed and the product does not exist", async () => {
            vi.spyOn(Product, "update").mockResolvedValue([0] as never);
            vi.spyOn(Product, "findByPk").mockResolvedValue(null);

            await expectNotFound(service.update(99, { stock: 7 }));
        });
    });

    describe("delete", () => {
        it("deletes the product by id", async () => {
            const destroy = vi.spyOn(Product, "destroy").mockResolvedValue(1);

            await expect(service.delete(1)).resolves.toBeUndefined();
            expect(destroy).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it("throws a 404 when the product does not exist", async () => {
            vi.spyOn(Product, "destroy").mockResolvedValue(0);

            await expectNotFound(service.delete(99));
        });
    });
});
