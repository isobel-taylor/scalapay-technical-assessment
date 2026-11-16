# Products service

## Description

A small API enabling CRUD operations on a product database, served by MySQL.

The API is written in NestJS using Sequelize for database communications.

## Project setup

1. Install dependencies

```bash
$ npm install
```

2. Copy the .env

```bash
$ cp .env.sample .env
```

3. Change the EXAMPLE_PASSWORD - this is the root password for the MySQL container.

## Start the project

Stand up the MySQL container

```bash
$ docker compose up -d
```

Create the database schema by running the migrations

```bash
$ npm run migrate
```

Run the server

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Migrations

The schema is managed with [Umzug](https://github.com/sequelize/umzug)
migrations in `src/database/migrations`, which record what they have applied
in the `SequelizeMeta` table. They connect using the same `.env` settings as
the server.

```bash
# apply all pending migrations
$ npm run migrate

# revert the most recent migration
$ npm run migrate:down

# list migrations that have not been applied yet
$ npm run migrate:pending

# apply migrations from the compiled build (after `npm run build`)
$ npm run migrate:prod
```

To add a migration, create a file in `src/database/migrations` exporting `up`
and `down` functions, and add it to the end of the list in
`src/database/migrator.ts`. Migrations are a record of history: once one has
been applied anywhere, add a new migration rather than editing it.

## Interacting with the API

Several helper scripts are available for using each endpoint:

```bash
# List all products
$ npm run list-products

# Create a product (token must be unique; stock is optional and defaults to 0)
$ npm run create-product -- --token "mug-001" --name "Mug" --price 12.99 --stock 9

# Get a product (id is required)
$ npm run get-product -- --id 1

# Update a product (id is required, others optional)
$ npm run update-product -- --id 1 --name "Kettle" --price 42.99 --stock 12

# Delete a product (id is required)
$ npm run delete-product -- --id 1
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
