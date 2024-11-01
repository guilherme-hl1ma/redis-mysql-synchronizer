import express from "express";
import { Request, Response, Router } from "express";
import { ProductsRepository } from "./ProductsRepository";
import { Product } from "./product";
import { Redis } from "./redis";

// Cria uma aplicação no 'express', define a porta do servidor e cria um 'router' para organizar as rotas.
const app = express();
const port = 3000;
const routes = Router();

// Permite o recebimento de JSON no corpo das requisições.
app.use(express.json());

// Instancia o repositório de 'products' para acessar o MySQL e o cliente do Redis.
const productsRepo = new ProductsRepository();
const redis = new Redis();

// Rota que indica que o servidor está funcionando.
routes.get("/", (req: Request, res: Response) => {
  res.statusCode = 200;
  res.send("Funcionando...");
});

// Rota que busca todos os 'products' no Redis.
routes.get("/getAllProducts", async (req: Request, res: Response) => {
  try {
    const result = await redis.searchAllProducts(); // Faz a busca de todos os 'products' no Redis.

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

// Rota que busca um 'product' no Redis pelo 'id'.
routes.get("/getById/:id", async (rec: Request, res: Response) => {
  try {
    const idParam = rec.params.id as unknown as number;

    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      res.statusCode = 404;
      res.type("application/json");
      res.send({ error: "Invalid id." });
      return;
    }

    const result = await redis.searchProductById(id); // Faz a busca do 'product' no Redis.
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

// Rota que cria um 'product' no MySQL e no Redis.
routes.post("/create", async (rec: Request, res: Response) => {
  try {
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

    const products = await productsRepo.create(newProduct); // Cria um 'product' no MySQL.

    redis.create(products); // Cria um 'product' no Redis.

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

// Rota que atualiza um 'product' existente no MySQL e no Redis.
routes.post("/update", async (rec: Request, res: Response) => {
  try {
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

    const products = await productsRepo.update(updatedProduct); // Atualiza o 'product' no MySQL.

    if (!products) {
      res.statusCode = 404;
      res.type("application/json");
      res.send({ error: "Product not found." });
      return;
    }

    await redis.update(products); // Atualiza o 'product' no Redis.

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

// Rota que deleta um 'product' existente no MySQL e no Redis.
routes.delete("/delete/:id", async (rec: Request, res: Response) => {
  try {
    const idParam = rec.params.id as unknown as number;

    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      res.statusCode = 404;
      res.type("application/json");
      res.send({ error: "Invalid id." });
      return;
    }

    const idResponse = await productsRepo.delete(id); // Deleta o 'product' no MySQL.
    if (idResponse === 0) {
      res.statusCode = 404;
      res.type("application/json");
      res.send({ error: "Product not found." });
      return;
    }

    redis.delete(id); // Deleta o 'product' no Redis.

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

// Aplica as rotas na aplicação web backend.
app.use(routes);

// Inicia o servidor na porta definida e sincroniza dados do MySQL com o Redis.
app.listen(port, async () => {
  console.log("Server is running on 3000");
  await redis.synchronize();
});
