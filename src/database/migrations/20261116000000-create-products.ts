import { DataTypes, QueryInterface } from "sequelize";
import type { MigrationFn } from "umzug";

// Migrations are a frozen record of how the schema changed, so the column
// definitions are written out here rather than imported from the model: a
// later change to the model must not rewrite history.

export const up: MigrationFn<QueryInterface> = async ({
    context: queryInterface,
}) => {
    await queryInterface.createTable("products", {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        productToken: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        stock: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    });
};

export const down: MigrationFn<QueryInterface> = async ({
    context: queryInterface,
}) => {
    await queryInterface.dropTable("products");
};
