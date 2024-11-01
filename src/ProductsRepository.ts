import { ResultSetHeader } from "mysql2";
import { conn } from "./db";
import { Product } from "./product";

// Define a classe ProductsRepository para gerenciar as operações de CRUD
// na tabela 'products' do MySQL.
export class ProductsRepository {

  // Método para obter todos os 'products' salvos no MySQL.
  getAll(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      conn.query<Product[]>("SELECT * FROM products", (err, res) => {
        if (err) reject(err); // Caso ocorra erro, rejeita a 'Promisse' com o erro.
        else resolve(res);    // Caso contrário, resolve a 'Promisse' com o array dos 'products'.
      });
    });
  }

  // Método para obter um 'product' de acordo com o 'id' salvo no MySQL.
  getById(product_id: number): Promise<Product | undefined> {
    return new Promise((resolve, reject) => {
      conn.query<Product[]>(
        "SELECT * FROM products WHERE id = ?",
        [product_id],             // Passa o 'id' do 'product' como parâmetro.
        (err, res) => {
          if (err) reject(err);   // Caso ocorra erro, rejeita a 'Promisse' com o erro.
          else resolve(res?.[0]); // Caso contrário, resolve a 'Promisse' com o primeiro 'product' encontrado.
        }
      );
    });
  }

  // Método para criar um 'product' no MySQL.
  create(p: Product): Promise<Product> {
    return new Promise((resolve, reject) => {
      conn.query<ResultSetHeader>(
        "INSERT INTO products (name, price, description) VALUES(?,?,?)",
        [p.name, p.price, p.description],       // Define os valores para 'name', 'price' e 'description'.
        (err, res) => {
          if (err) reject(err);                 // Caso ocorra erro, rejeita a 'Promisse' com o erro.
          else
            this.getById(res.insertId)          // Busca o 'product' inserido usando o 'id' gerado.
                .then((user) => resolve(user!)) // Resolve a Promise com o 'product' criado.
                .catch(reject);                 // Rejeita a Promise caso ocorra um erro na busca.
        }
      );
    });
  }

  // Método para atualizar um 'product' existente no MySQL.
  update(p: Product): Promise<Product | undefined> {
    return new Promise((resolve, reject) => {
      conn.query<ResultSetHeader>(
        "UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?",
        [p.name, p.price, p.description, p.id], // Define os valores a serem atualizados e o 'id' do 'product'.
        (err, res) => {
          if (err) reject(err);                 // Caso ocorra erro, rejeita a 'Promisse' com o erro.
          else 
            this.getById(p.id!)                 // Busca o 'product' atualizado usando o 'id'.                
                .then(resolve)                  // Resolve a Promise com o 'product' atualizado.
                .catch(reject);                 // Rejeita a Promise caso ocorra um erro na busca.
        }
      );
    });
  }

  // Método que deleta um 'product' de acordo com o 'id' salvo no MySQL.
  delete(product_id: number): Promise<number> {
    return new Promise((resolve, reject) => {
      conn.query<ResultSetHeader>(
        "DELETE FROM products WHERE id = ?",
        [product_id],                     // Passa o 'id' do 'product' como parâmetro.
        (err, res) => {
          if (err) reject(err);           // Caso ocorra erro, rejeita a 'Promisse' com o erro.
          else resolve(res.affectedRows); // Resolve a Promise com as linhas afetadas.
        }
      );
    });
  }
}
