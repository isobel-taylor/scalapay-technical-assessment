# Samples

The following is a list of commands and their outputs at each step, from a fresh
database:

1. Ensure the database exists

```bash
$ npm run migrate

> product-service@0.0.1 migrate
> tsx src/database/migrate.ts up

{ event: 'migrating', name: '20261116000000-create-products' }
{
  event: 'migrated',
  name: '20261116000000-create-products',
  durationSeconds: 0.073
}
{ event: 'up', message: 'applied 1 migrations.' }
```

2. List all products - empty

```bash
$ npm run list-products

> product-service@0.0.1 list-products
> tsx cli/list-products.ts

[]
```

3. Create a mug

```bash
$ npm run create-product -- --token mug-001 --name "Pikachu mug" --price 12 --stock 28

> product-service@0.0.1 create-product
> tsx cli/create-product.ts --token mug-001 --name Pikachu mug --price 12 --stock 28

{
    "id": 1
}
```

4. Retrieve the mug we just created

```bash
$ npm run get-product -- --id 1

> product-service@0.0.1 get-product
> tsx cli/get-product.ts --id 1

{
    "id": 1,
    "productToken": "mug-001",
    "name": "Pikachu mug",
    "price": "12.00",
    "stock": 28,
    "createdAt": "2026-11-16T03:48:59.000Z",
    "updatedAt": "2026-11-16T03:48:59.000Z"
}
```

5. Update the mug with a new price

```bash
$ npm run update-product -- --id 1 --price 9.99

> product-service@0.0.1 update-product
> tsx cli/update-product.ts --id 1 --price 9.99

{
    "id": 1,
    "productToken": "mug-001",
    "name": "Pikachu mug",
    "price": "9.99",
    "stock": 28,
    "createdAt": "2026-11-16T03:48:59.000Z",
    "updatedAt": "2026-11-16T03:50:16.000Z"
}
```

6. Create a kettle

```bash
$ npm run create-product -- --token kettle-001 --name "Fancy kettle" --price 80 --stock 7

> product-service@0.0.1 create-product
> tsx cli/create-product.ts --token kettle-001 --name Fancy kettle --price 80 --stock 7

{
    "id": 2
}
```

7. Create a plushie

```bash
$ npm run create-product -- --token plushie-001 --name "Eevie plushie" --price 27.50 --stock 12

> product-service@0.0.1 create-product
> tsx cli/create-product.ts --token plushie-001 --name Eevie plushie --price 27.50 --stock 12

{
    "id": 3
}
```

8. Create a fan

```bash
$ npm run create-product -- --token fan-001 --name "Standing fan" --price 48 --stock 5

> product-service@0.0.1 create-product
> tsx cli/create-product.ts --token fan-001 --name Standing fan --price 48 --stock 5

{
    "id": 4
}
```

9. Delete the plushie

```bash
$ npm run delete-product -- --id 3

> product-service@0.0.1 delete-product
> tsx cli/delete-product.ts --id 3

{
    "id": 3
}
```

10. List all products - the plushie is gone

```bash
$ npm run list-products

> product-service@0.0.1 list-products
> tsx cli/list-products.ts

[
    {
        "id": 1,
        "productToken": "mug-001",
        "name": "Pikachu mug",
        "price": "9.99",
        "stock": 28,
        "createdAt": "2026-11-16T03:48:59.000Z",
        "updatedAt": "2026-11-16T03:50:16.000Z"
    },
    {
        "id": 2,
        "productToken": "kettle-001",
        "name": "Fancy kettle",
        "price": "80.00",
        "stock": 7,
        "createdAt": "2026-11-16T03:50:54.000Z",
        "updatedAt": "2026-11-16T03:50:54.000Z"
    },
    {
        "id": 4,
        "productToken": "fan-001",
        "name": "Standing fan",
        "price": "48.00",
        "stock": 5,
        "createdAt": "2026-11-16T03:52:20.000Z",
        "updatedAt": "2026-11-16T03:52:20.000Z"
    }
]
```

11. Return the first two products with curl

```bash
$ curl http://localhost:3000/products?page=1\&pageSize=2
{"products":[{"id":1,"productToken":"mug-001","name":"Pikachu mug","price":"9.99","stock":28,"createdAt":"2026-11-16T03:48:59.000Z","updatedAt":"2026-11-16T03:50:16.000Z"},{"id":2,"productToken":"kettle-001","name":"Fancy kettle","price":"80.00","stock":7,"createdAt":"2026-11-16T03:50:54.000Z","updatedAt":"2026-11-16T03:50:54.000Z"}],"total":3}
```

12. Return the third product with curl

```bash
{"products":[{"id":4,"productToken":"fan-001","name":"Standing fan","price":"48.00","stock":5,"createdAt":"2026-11-16T03:52:20.000Z","updatedAt":"2026-11-16T03:52:20.000Z"}],"total":3}
```
