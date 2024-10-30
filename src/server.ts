import express from "express";
import { Request, Response, Router } from "express";
import { ProductsRepository } from "./ProductsRepository";
import { Product } from "./product";
import { SchemaFieldTypes } from "redis";
import { client } from "./redis";

const app = express();
const port = 3000;
const routes = Router();

//permite passar os parametros por json
app.use(express.json());

const productsRepo = new ProductsRepository();

routes.get("/", (req: Request, res: Response) => {
  res.statusCode = 200;
  res.send("Funcionando...");
});

routes.get("/getAllProducts", async (req: Request, res: Response) => {
  // obter todos os produtos.
  const result = await client.ft.search("idx:products", "*");

  //const products = await productsRepo.getAll();

  const products = result.documents;
  res.statusCode = 200;
  res.type("application/json");
  res.send(products);
});

routes.get("/getById/:id", async (rec: Request, res: Response) => {
  const id = rec.params.id as unknown as number;
  const result = await client.HGETALL("products:" + id);
  //console.log(JSON.stringify(result, null, 2))
  //const result = await client.ft.search("idx:products", `@products: ${id}`);

  const product = JSON.stringify(result, null, 2);

  /* const products = await productsRepo.getById(
    rec.params.id as unknown as number
  ); */

  res.statusCode = 200;
  res.type("application/json");
  res.send(product);
});

routes.post("/create", async (rec: Request, res: Response) => {
  const newProduct = rec.body as Product;
  const products = await productsRepo.create(newProduct);

  try {
    const respReply = await client.ft.INFO("idx:products");

    if (respReply.indexName == null) {
      client.ft.create("idx:products", {
        name: SchemaFieldTypes.TEXT,
        price: SchemaFieldTypes.NUMERIC,
        dscription: SchemaFieldTypes.TEXT,
      });
    }
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "Index already exists")
        console.log("Index exists already, skipped creation.");
      else {
        console.error(e);
        process.exit(1);
      }
    }
  }

  client.hSet(`products:${products.ID}`, rec.body);
  res.statusCode = 200;
  res.type("application/json");
  res.send(products);
});

routes.post("/update", async (rec: Request, res: Response) => {
  const updatedProduct = rec.body as Product;

  const redisProduct = {
    name: updatedProduct.name,
    price: updatedProduct.price,
    description: updatedProduct.description,
  };

  const products = await productsRepo.update(updatedProduct);
  await client.hSet(`products:${updatedProduct.id}`, redisProduct);

  res.statusCode = 200;
  res.type("application/json");
  res.send(products);
});

routes.delete("/delete/:id", async (rec: Request, res: Response) => {
  const id = rec.params.id as unknown as number;

  await productsRepo.delete(id);
  await client.del("products:" + id);

  res.statusCode = 200;
  res.type("application/json");
  res.send("OK");
});

// aplicar as rotas na aplicação web backend.
app.use(routes);

app.listen(3000, async () => {
  console.log("Server is running on 3000");
  console.log("\nSynchronizing MySQL data to redis...");

  const products = await productsRepo.getAll();
  products.forEach((product) => {
    const name = product.NAME;
    const price = product.PRICE;
    const description = product.DESCRIPTION;
    client.hSet(`products:${product.ID}`, { name, price, description });
  });

  console.log("Synchronization completed.");
});
