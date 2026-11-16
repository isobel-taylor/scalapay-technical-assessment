import { HttpException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ProductsController } from "./products.controller.js";
import { ProductsService } from "./products.service.js";
import { Product } from "./product.model.js";

describe("ProductsController", () => {
    let productsController: ProductsController;
    let productsService: {
        findAll: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        findOne: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
    };

    const product = {
        id: 1,
        name: "Widget",
        price: "9.99",
        stock: 3,
    } as unknown as Product;

    beforeEach(async () => {
        productsService = {
            findAll: vi.fn(),
            create: vi.fn(),
            findOne: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };

        const app: TestingModule = await Test.createTestingModule({
            controllers: [ProductsController],
            providers: [
                { provide: ProductsService, useValue: productsService },
            ],
        }).compile();

        productsController = app.get<ProductsController>(ProductsController);
    });

    describe("findAll", () => {
        const emptyPage = { products: [], total: 0 };

        it("defaults to page 1 with a page size of 25", async () => {
            productsService.findAll.mockResolvedValue({
                products: [product],
                total: 1,
            });

            await expect(productsController.findAll({})).resolves.toEqual({
                products: [product],
                total: 1,
            });
            expect(productsService.findAll).toHaveBeenCalledWith(1, 25);
        });

        it("passes through an explicit page and page size", async () => {
            productsService.findAll.mockResolvedValue(emptyPage);

            await productsController.findAll({ page: 3, pageSize: 10 });

            expect(productsService.findAll).toHaveBeenCalledWith(3, 10);
        });

        it("defaults only the parameter that is missing", async () => {
            productsService.findAll.mockResolvedValue(emptyPage);

            await productsController.findAll({ page: 2 });
            expect(productsService.findAll).toHaveBeenLastCalledWith(2, 25);

            await productsController.findAll({ pageSize: 50 });
            expect(productsService.findAll).toHaveBeenLastCalledWith(1, 50);
        });
    });

    describe("create", () => {
        it("creates the product and returns its new id", async () => {
            productsService.create.mockResolvedValue(42);
            const body = {
                productToken: "widget-001",
                name: "Widget",
                price: 9.99,
                stock: 3,
            };

            await expect(
                productsController.create(body),
            ).resolves.toStrictEqual({
                id: 42,
            });
            expect(productsService.create).toHaveBeenCalledWith(body);
        });
    });

    describe("findOne", () => {
        it("returns the product with the given id", async () => {
            productsService.findOne.mockResolvedValue(product);

            await expect(productsController.findOne({ id: 1 })).resolves.toBe(
                product,
            );
            expect(productsService.findOne).toHaveBeenCalledWith(1);
        });

        it("propagates a not found error from the service", async () => {
            productsService.findOne.mockRejectedValue(
                new HttpException("Product not found", 404),
            );

            await expect(
                productsController.findOne({ id: 99 }),
            ).rejects.toThrow("Product not found");
        });
    });

    describe("update", () => {
        it("updates the product with the given id and returns the id", async () => {
            productsService.update.mockResolvedValue(undefined);
            const body = { stock: 7 };

            await expect(
                productsController.update({ id: 1 }, body),
            ).resolves.toStrictEqual({ id: 1 });
            expect(productsService.update).toHaveBeenCalledWith(1, body);
        });

        it("propagates a not found error from the service", async () => {
            productsService.update.mockRejectedValue(
                new HttpException("Product not found", 404),
            );

            await expect(
                productsController.update({ id: 99 }, { stock: 1 }),
            ).rejects.toThrow("Product not found");
        });
    });

    describe("delete", () => {
        it("deletes the product with the given id and returns the id", async () => {
            productsService.delete.mockResolvedValue(undefined);

            await expect(
                productsController.delete({ id: 1 }),
            ).resolves.toStrictEqual({
                id: 1,
            });
            expect(productsService.delete).toHaveBeenCalledWith(1);
        });

        it("propagates a not found error from the service", async () => {
            productsService.delete.mockRejectedValue(
                new HttpException("Product not found", 404),
            );

            await expect(productsController.delete({ id: 99 })).rejects.toThrow(
                "Product not found",
            );
        });
    });
});
