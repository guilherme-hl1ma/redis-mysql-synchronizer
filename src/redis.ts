import { createClient, RedisClientType, SchemaFieldTypes } from "redis";
import { Product } from "./product";
import { ProductsRepository } from "./ProductsRepository";

export class Redis {
  private client: RedisClientType;
  private productRepository: ProductsRepository;

  constructor() {
    this.client = createClient();
    this.conn();
    this.onError();
    this.productRepository = new ProductsRepository();
  }

  async conn(): Promise<RedisClientType> {
    if (this.client.isOpen) {
      return this.client;
    }
    try {
      await this.client.connect();
      return this.client;
    } catch (error) {
      throw new Error("Failed to connect to redis: " + error);
    }
  }

  onError(): RedisClientType {
    return this.client.on("error", (err) =>
      console.log("Redis Client Error", err)
    );
  }

  async createIndex() {
    try {
      await this.client.ft.INFO("idx:products");
    } catch (error) {
      console.log("Index does not exist. Creating a new one...");
      await this.client.ft.CREATE(
        "idx:products",
        {
          ID: { type: SchemaFieldTypes.NUMERIC },
          NAME: { type: SchemaFieldTypes.TEXT },
          PRICE: { type: SchemaFieldTypes.NUMERIC },
          DESCRIPTION: { type: SchemaFieldTypes.TEXT },
        },
        {
          ON: "HASH",
          PREFIX: "products:",
        }
      );
    }
  }

  async searchAllProducts() {
    return await this.client.ft.SEARCH("idx:products", "*");
  }

  async searchProductById(id: number | unknown) {
    return await this.client.ft.SEARCH("idx:products", `@ID: [${id} ${id}]`);
  }

  async create(product: Product) {
    await this.client.HSET(`products:${product.ID}`, product);
  }

  async update(product: Product | undefined) {
    if (product)
      await this.client.HSET(`products:${product.ID}`, product);
  }

  async delete(id: number | unknown) {
    await this.client.DEL(`products:${id}`);
  }

  async synchronize() {
    console.log("\nSynchronizing MySQL data to redis...");

    await this.createIndex();

    const products = await this.productRepository.getAll();
    products.forEach(async (product) => {
      await this.client.HSET(`products:${product.ID}`, product);
    });

    console.log("Synchronization completed.");
  }
}
