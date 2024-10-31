import { RowDataPacket } from "mysql2";

export interface Product extends RowDataPacket {
  id?: number;
  name: string;
  price: number;
  description: string;
}
