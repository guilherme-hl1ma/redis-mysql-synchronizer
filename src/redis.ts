import { createClient, RedisClientType, SchemaFieldTypes } from "redis";
import { Product } from "./product";
import { ProductsRepository } from "./ProductsRepository";

// Define a classe Redis para gerenciar as operações de Redis.
export class Redis {
  private client: RedisClientType;               // Instância do cliente Redis.
  private productRepository: ProductsRepository; // Instância do repositório de 'products' para sincronização com o MySQL.

  constructor() {
    this.client = createClient();                      // Inicializa o cliente Redis.
    this.conn();                                       // Conecta ao Redis.
    this.onError();                                    // Define o tratamento de erros.
    this.productRepository = new ProductsRepository(); // Inicializa o repositório de 'products'.
  }

  // Método para conectar ao Redis.
  async conn(): Promise<RedisClientType> {
    if (this.client.isOpen) {
      return this.client;                                      // Retorna o cliente se já estiver conectado.
    }
    try {
      await this.client.connect();                             // Conecta ao Redis.
      return this.client;
    } catch (error) {
      throw new Error("Failed to connect to redis: " + error); // Lança um erro caso a conexão falhe.
    }
  }

  // Método que configura o tratamento de erros do cliente Redis.
  onError() {
    this.client.on("error", (err) => {
      throw new Error("Redis Client Error: " + err); // Lança um erro se houver um problema com o cliente Redis.
    });
  }

  // Método que cria um índice no Redis para organizar as pesquisas.
  async createIndex() {
    try {
      await this.client.ft.INFO("idx:products"); // Verifica se o índice já existe.

      // Remove as chaves de 'products' anteriores, se existirem.
      const prefix = "products:";
      const keys = await this.client.keys(`${prefix}*`);
      if (keys.length > 0)  await this.client.del(keys);

    } catch (error) {
      console.log("Index does not exist. Creating a new one...");

      // Agora, após a exclusão das chaves de 'products' ou caso não havia chaves de 'products' salvas no Redis,
      // é criado um novo índice.
      await this.client.ft.CREATE(
        "idx:products",
        {
          ID: { type: SchemaFieldTypes.NUMERIC },
          NAME: { type: SchemaFieldTypes.TEXT },
          PRICE: { type: SchemaFieldTypes.NUMERIC },
          DESCRIPTION: { type: SchemaFieldTypes.TEXT },
        },
        {
          ON: "HASH",                              // Define o índice como baseado em hashes.
          PREFIX: "products:",                     // Define o prefixo das chaves para o índice.
        }
      );
    }
  }

  // Método que busca todos os 'products' no Redis.
  async searchAllProducts() {
    try {
      return await this.client.ft.SEARCH("idx:products", "*"); // Retorna todos os 'products'.
    } catch (e) {
      throw new Error("Failed to find products in Redis."); // Lança um erro caso não tenha achado nenhum 'product'.
    }
  }

  // Método que busca um 'product' no Redis de acordo com o 'id'.
  async searchProductById(id: number | unknown) {
    try {
      return await this.client.ft.SEARCH("idx:products", `@ID: [${id} ${id}]`); // Retorna o 'product' encontrado.
    } catch (e) {
      throw new Error("Failed to find the product in Redis."); // Lança um erro caso não tenha achado o 'product'.
    }
  }

  // Método que cria um 'product' no Redis.
  async create(product: Product) {
    if (!product) throw new Error("Product data is undefined.");

    try {
      await this.client.HSET(`products:${product.ID}`, product); // Atualiza o hash do 'product'.
    } catch (e) {
      throw new Error("Failed to creat product in Redis."); // Lança um erro caso não tenha criado o 'product'.
    }
  }

  //Método que atualiza um 'product' existente no Redis.
  async update(product: Product | undefined) {
    if (!product) throw new Error("Product data is undefined.");

    try {
      await this.client.HSET(`products:${product.ID}`, product); // Atualiza o hash do 'product'.
    } catch (error) {
      throw new Error("Failed to update product in Redis."); // Lança um erro caso não tenha atualizado o 'product'.
    }
  }

  // Método que deleta um 'product' existente no Redis.
  async delete(id: number | unknown) {
    try {
      await this.client.DEL(`products:${id}`); // Deleta o hash do 'product'.
    } catch (e) {
      throw new Error("Failed to delete product in Redis."); // Lança um erro caso não tenha deletado o 'product'.
    }
  }

  // Método que sincroniza os dados do MySQL para o Redis.
  async synchronize() {
    // Verifica se o Redis está conectado.
    if (!this.client.isOpen) {
      console.error("Redis is not connected. Reset server.");
      return;
    }
    try {
      console.log("\nSynchronizing MySQL data to redis...");

      await this.createIndex(); // Cria o índice se ele não existir.

      // Faz a busca de todos os 'products' no MySQL, e cada 'product' é adicionado no Redis.
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
