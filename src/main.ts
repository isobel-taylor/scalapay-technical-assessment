import "dotenv/config";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { createValidationPipe } from "./validation.js";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        routeConflictPolicy: {
            duplicate: "error",
            shadow: "error",
        },
    });
    app.useGlobalPipes(createValidationPipe());
    // Run shutdown hooks (closing the database connection) on SIGTERM/SIGINT.
    app.enableShutdownHooks();

    await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
