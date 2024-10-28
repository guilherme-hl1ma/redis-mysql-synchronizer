import { ResultSetHeader } from "mysql2";
import { conn } from "./db";
import { Product } from "./product";

//o dump passa 'products' no minusculo, tive que mudar pra funcionar
export class ProductsRepository {
  getAll(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      conn.query<Product[]>("SELECT * FROM products", (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  getById(product_id: number): Promise<Product | undefined> {
    return new Promise((resolve, reject) => {
      conn.query<Product[]>(
        "SELECT * FROM products WHERE id = ?",
        [product_id],
        (err, res) => {
          if (err) reject(err);
          else resolve(res?.[0]);
        }
      );
    });
  }

  create(p: Product): Promise<Product> {
    return new Promise((resolve, reject) => {
      conn.query<ResultSetHeader>(
        "INSERT INTO products (name, price, description) VALUES(?,?,?)",
        [p.name, p.price, p.description],
        (err, res) => {
          if (err) reject(err);
          else
            this.getById(res.insertId)
              .then((user) => resolve(user!))
              .catch(reject);
        }
      );
    });
  }

  update(p: Product): Promise<Product | undefined> {
    return new Promise((resolve, reject) => {
      conn.query<ResultSetHeader>(
        "UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?",
        [p.name, p.price, p.description, p.id],
        (err, res) => {
          if (err) reject(err);
          else this.getById(p.id!).then(resolve).catch(reject);
        }
      );
    });
  }

  delete(product_id: number): Promise<number> {
    return new Promise((resolve, reject) => {
      conn.query<ResultSetHeader>(
        "DELETE FROM products WHERE id = ?",
        [product_id],
        (err, res) => {
          if (err) reject(err);
          else resolve(res.affectedRows);
        }
      );
    });
  }
}
