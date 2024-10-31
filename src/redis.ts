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

  onError() {
    this.client.on("error", (err) => {
      //console.log("Redis Client Error", err);
      throw new Error("Redis Client Error: " + err)
    });
  }

  async createIndex() {
    try {
      await this.client.ft.INFO("idx:products");

      const prefix = "products:";
      const keys = await this.client.keys(`${prefix}*`);
      if (keys.length > 0)  await this.client.del(keys);
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
    try {
      return await this.client.ft.SEARCH("idx:products", "*");
    } catch (e) {
      throw new Error("Failed to find products in Redis.");
    }
  }

  async searchProductById(id: number | unknown) {
    try {
      return await this.client.ft.SEARCH("idx:products", `@ID: [${id} ${id}]`);
    } catch (e) {
      throw new Error("Failed to find the product in Redis.");
    }
  }

  async create(product: Product) {
    if (!product) throw new Error("Product data is undefined.");

    try {
      await this.client.HSET(`products:${product.ID}`, product);
    } catch (e) {
      throw new Error("Failed to creat product in Redis.");
    }
  }

  async update(product: Product | undefined) {
    if (!product) throw new Error("Product data is undefined.");

    try {
      await this.client.HSET(`products:${product.ID}`, product);
    } catch (error) {
      throw new Error("Failed to update product in Redis.");
    }
  }

  async delete(id: number | unknown) {
    try {
      await this.client.DEL(`products:${id}`);
    } catch (e) {
      throw new Error("Failed to delete product in Redis.");
    }
  }

  async synchronize() {
    if (!this.client.isOpen) {
      console.error("Redis is not connected. Reset server.");
      return;
    }
    try {
      console.log("\nSynchronizing MySQL data to redis...");

      await this.createIndex();

      const products = await this.productRepository.getAll();
      products.forEach(async (product) => {
        await this.client.HSET(`products:${product.ID}`, product);
      });

      console.log("Synchronization completed.");
    } catch (e) {
      if (e instanceof Error) console.error(e.message);
    }
  }
}
