import { ValidationPipe } from "@nestjs/common";

/**
 * The global validation pipe used by the application. Shared between
 * `main.ts` and the tests so both exercise exactly the same configuration.
 */
export function createValidationPipe(): ValidationPipe {
    return new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        errorFormat: "grouped",
    });
}
