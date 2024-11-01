import { RowDataPacket } from "mysql2";

// Define uma interface 'Product' que estende 'RowDataPacket'.
// Isso permite que a interface represente uma linha de dados do banco de dados.
export interface Product extends RowDataPacket {
  id: number;          // ID do produto (número).
  name: string;        // Nome do produto (string).
  price: number;       // Preço do produto (número).
  description: string; // Descrição do produto (string).
}
