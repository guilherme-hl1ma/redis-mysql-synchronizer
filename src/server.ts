import express from "express";
import { Request, Response, Router } from "express";
import { ProductsRepository } from "./ProductsRepository";
import { Product } from "./product";
import { Redis } from "./Redis";

const app = express();
const port = 3000;
const routes = Router();

//permite passar os parametros por json
app.use(express.json());

const productsRepo = new ProductsRepository();
const redis = new Redis();

routes.get("/", (req: Request, res: Response) => {
  res.statusCode = 200;
  res.send("Funcionando...");
});

routes.get("/getAllProducts", async (req: Request, res: Response) => {
  await redis.synchronize();
  const result = await redis.searchAllProducts();

  const products = result.documents;
  res.statusCode = 200;
  res.type("application/json");
  res.send(products);
});

routes.get("/getById/:id", async (rec: Request, res: Response) => {
  await redis.synchronize();

  const id = rec.params.id as unknown as number;
  const result = await redis.searchProductById(id);

  const product = JSON.stringify(result.documents[0], null, 2);

  res.statusCode = 200;
  res.type("application/json");
  res.send(product);
});

routes.post("/create", async (rec: Request, res: Response) => {
  await redis.synchronize();

  const newProduct = rec.body as Product;
  const products = await productsRepo.create(newProduct);

  redis.create(products);

  res.statusCode = 200;
  res.type("application/json");
  res.send(products);
});

routes.post("/update", async (rec: Request, res: Response) => {
  try {
    await redis.synchronize();

    const updatedProduct = rec.body as Product;

    if (!updatedProduct) {
      res.statusCode = 400;
      res.type("application/json");
      res.send({ error: "Invalid product data." });
    }

    const products = await productsRepo.update(updatedProduct);

    if (!products) {
      res.statusCode = 404;
      res.type("application/json")
      res.send({ error: "Product not found." });
    }

    redis.update(products);

    res.statusCode = 200;
    res.type("application/json");
    res.send(products);
  } catch (e) {
    res.statusCode = 404;
    res.send({ error: e})
  }
});

routes.delete("/delete/:id", async (rec: Request, res: Response) => {
  await redis.synchronize();
  const id = rec.params.id as unknown as number;

  await productsRepo.delete(id);

  redis.delete(id);

  res.statusCode = 200;
  res.type("application/json");
  res.send("OK");
});

// aplicar as rotas na aplicação web backend.
app.use(routes);

app.listen(port, async () => {
  console.log("Server is running on 3000");
});
