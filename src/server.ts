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
  try {
    await redis.synchronize();

    const result = await redis.searchAllProducts();

    if (result.total === 0) {
      res.statusCode = 404;
      res.type("application/json");
      res.send({ error: "Products not found." });
      return;
    }

    const products = result.documents;
    res.statusCode = 200;
    res.type("application/json");
    res.send(products);
  } catch (error) {
    res.statusCode = 500;
    res.type("application/json");
    res.send({
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
    return;
  }
});

routes.get("/getById/:id", async (rec: Request, res: Response) => {
  try {
    await redis.synchronize();

    const idParam = rec.params.id as unknown as number;

    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      res.statusCode = 404;
      res.type("application/json");
      res.send({ error: "Invalid id." });
      return;
    }

    const result = await redis.searchProductById(id);
    if (result.total === 0) {
      res.statusCode = 404;
      res.type("application/json");
      res.send({ error: "Product not found." });
      return;
    }

    const product = JSON.stringify(result.documents[0], null, 2);

    res.statusCode = 200;
    res.type("application/json");
    res.send(product);
  } catch (error) {
    res.statusCode = 500;
    res.type("application/json");
    res.send({
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
    return;
  }
});

routes.post("/create", async (rec: Request, res: Response) => {
  try {
    await redis.synchronize();

    const newProduct = rec.body as Product;
    if (
      !newProduct ||
      typeof newProduct.name !== "string" ||
      typeof newProduct.price !== "number" ||
      typeof newProduct.description !== "string"
    ) {
      res.statusCode = 404;
      res.type("application/json");
      res.send({ error: "Invalid product data." });
      return;
    }

    const products = await productsRepo.create(newProduct);

    redis.create(products);

    res.statusCode = 200;
    res.type("application/json");
    res.send(products);
  } catch (e) {
    res.statusCode = 500;
    res.type("application/json");
    res.send({
      error: e instanceof Error ? e.message : "Internal Server Error",
    });
    return;
  }
});

routes.post("/update", async (rec: Request, res: Response) => {
  try {
    await redis.synchronize();

    const updatedProduct = rec.body as Product;

    if (
      !updatedProduct ||
      typeof updatedProduct.id !== "number" ||
      typeof updatedProduct.name !== "string" ||
      typeof updatedProduct.price !== "number" ||
      typeof updatedProduct.description !== "string"
    ) {
      res.statusCode = 400;
      res.type("application/json");
      res.send({ error: "Invalid product data." });
      return;
    }

    const products = await productsRepo.update(updatedProduct);

    if (!products) {
      res.statusCode = 404;
      res.type("application/json");
      res.send({ error: "Product not found." });
      return;
    }

    await redis.update(products);

    res.statusCode = 200;
    res.type("application/json");
    res.send(products);
  } catch (e) {
    res.statusCode = 500;
    res.type("application/json");
    res.send({
      error: e instanceof Error ? e.message : "Internal Server Error",
    });
    return;
  }
});

routes.delete("/delete/:id", async (rec: Request, res: Response) => {
  try {
    await redis.synchronize();

    const idParam = rec.params.id as unknown as number;

    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      res.statusCode = 404;
      res.type("application/json");
      res.send({ error: "Invalid id." });
      return;
    }

    const idResponse = await productsRepo.delete(id);
    if (idResponse === 0) {
      res.statusCode = 404;
      res.type("application/json");
      res.send({ error: "Product not found." });
      return;
    }

    redis.delete(id);

    res.statusCode = 200;
    res.type("application/json");
    res.send("OK");
  } catch (e) {
    res.statusCode = 500;
    res.type("application/json");
    res.send({
      error: e instanceof Error ? e.message : "Internal Server Error",
    });
    return;
  }
});

// aplicar as rotas na aplicação web backend.
app.use(routes);

app.listen(port, async () => {
  console.log("Server is running on 3000");
});
