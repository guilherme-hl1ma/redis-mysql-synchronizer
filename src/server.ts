import express from "express";
import { Request, Response, Router } from "express";
import { ProductsRepository } from "./ProductsRepository";
import { Product } from "./product";

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
  const products = await productsRepo.getAll();
  res.statusCode = 200;
  res.type("application/json");
  res.send(products);
});

routes.get("/getById/:id", async (rec: Request, res: Response) => {
  const products = await productsRepo.getById(
    rec.params.id as unknown as number
  );
  res.statusCode = 200;
  res.type("application/json");
  res.send(products);
});

routes.post("/create", async (rec: Request, res: Response) => {
  const newProduct = rec.body as Product;
  const products = await productsRepo.create(newProduct);
  res.statusCode = 200;
  res.type("application/json");
  res.send(products);
});

routes.post("/update", async (rec: Request, res: Response) => {
  const updatedProduct = rec.body as Product;
  const products = await productsRepo.update(updatedProduct);
  res.statusCode = 200;
  res.type("application/json");
  res.send(products);
});

routes.delete("/delete/:id", async (rec: Request, res: Response) => {
  await productsRepo.delete(rec.params.id as unknown as number);
  res.statusCode = 200;
  res.type("application/json");
});

// aplicar as rotas na aplicação web backend.
app.use(routes);

app.listen(3000, () => {
  console.log("Server is running on 3000");
});
