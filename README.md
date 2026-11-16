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

Run the server

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

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
