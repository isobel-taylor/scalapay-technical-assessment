import { HttpException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { ProductType } from "./db/types.js";

describe("AppController", () => {
    let appController: AppController;
    let appService: {
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
    } as unknown as ProductType;

    beforeEach(async () => {
        appService = {
            findAll: vi.fn(),
            create: vi.fn(),
            findOne: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };

        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [{ provide: AppService, useValue: appService }],
        }).compile();

        appController = app.get<AppController>(AppController);
    });

    describe("findAll", () => {
        it("defaults to page 1 with a page size of 25", async () => {
            appService.findAll.mockResolvedValue([product]);

            await expect(appController.findAll({})).resolves.toEqual([product]);
            expect(appService.findAll).toHaveBeenCalledWith(1, 25);
        });

        it("passes through an explicit page and page size", async () => {
            appService.findAll.mockResolvedValue([]);

            await appController.findAll({ page: 3, pageSize: 10 });

            expect(appService.findAll).toHaveBeenCalledWith(3, 10);
        });

        it("defaults only the parameter that is missing", async () => {
            appService.findAll.mockResolvedValue([]);

            await appController.findAll({ page: 2 });
            expect(appService.findAll).toHaveBeenLastCalledWith(2, 25);

            await appController.findAll({ pageSize: 50 });
            expect(appService.findAll).toHaveBeenLastCalledWith(1, 50);
        });
    });

    describe("create", () => {
        it("creates the product and returns its new id", async () => {
            appService.create.mockResolvedValue(42);
            const body = {
                productToken: "widget-001",
                name: "Widget",
                price: 9.99,
                stock: 3,
            };

            await expect(appController.create(body)).resolves.toStrictEqual({
                id: 42,
            });
            expect(appService.create).toHaveBeenCalledWith(body);
        });
    });

    describe("findOne", () => {
        it("returns the product with the given id", async () => {
            appService.findOne.mockResolvedValue(product);

            await expect(appController.findOne({ id: 1 })).resolves.toBe(
                product,
            );
            expect(appService.findOne).toHaveBeenCalledWith(1);
        });

        it("propagates a not found error from the service", async () => {
            appService.findOne.mockRejectedValue(
                new HttpException("Product not found", 404),
            );

            await expect(appController.findOne({ id: 99 })).rejects.toThrow(
                "Product not found",
            );
        });
    });

    describe("update", () => {
        it("updates the product with the given id and returns the id", async () => {
            appService.update.mockResolvedValue(undefined);
            const body = { stock: 7 };

            await expect(
                appController.update({ id: 1 }, body),
            ).resolves.toStrictEqual({ id: 1 });
            expect(appService.update).toHaveBeenCalledWith(1, body);
        });

        it("propagates a not found error from the service", async () => {
            appService.update.mockRejectedValue(
                new HttpException("Product not found", 404),
            );

            await expect(
                appController.update({ id: 99 }, { stock: 1 }),
            ).rejects.toThrow("Product not found");
        });
    });

    describe("delete", () => {
        it("deletes the product with the given id and returns the id", async () => {
            appService.delete.mockResolvedValue(undefined);

            await expect(
                appController.delete({ id: 1 }),
            ).resolves.toStrictEqual({
                id: 1,
            });
            expect(appService.delete).toHaveBeenCalledWith(1);
        });

        it("propagates a not found error from the service", async () => {
            appService.delete.mockRejectedValue(
                new HttpException("Product not found", 404),
            );

            await expect(appController.delete({ id: 99 })).rejects.toThrow(
                "Product not found",
            );
        });
    });
});
