import { DataTypes, Sequelize } from "sequelize";

export const sequelize = new Sequelize({
    dialect: "mysql",
    host: "127.0.0.1",
    port: 3306,
    database: process.env.MYSQL_DATABASE,
    username: "root",
    password: process.env.MYSQL_ROOT_PASSWORD,
});

const Product = sequelize.define(
    "Product",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        productToken: {
            type: DataTypes.UUIDV4,
            unique: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        stock: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    },
    {
        tableName: "products",
    },
);

// Force reset the DB on start. Highly discouraged in production.
(async () => {
    await sequelize.sync({ force: true });
})();
