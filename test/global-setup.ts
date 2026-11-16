import { createConnection } from "mysql2/promise";

/**
 * Ensures the e2e test database exists before any test file runs. The MySQL
 * container only creates the database named in `.env`, not the `_test` one.
 */
export default async function setup(): Promise<void> {
    const database = process.env.MYSQL_DATABASE;
    if (!database?.endsWith("_test")) {
        throw new Error(
            `Refusing to run e2e tests against non-test database "${database}"`,
        );
    }

    const connection = await createConnection({
        host: "127.0.0.1",
        port: 3306,
        user: "root",
        password: process.env.MYSQL_ROOT_PASSWORD,
    });
    try {
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${connection.escapeId(database)}`,
        );
    } finally {
        await connection.end();
    }
}
