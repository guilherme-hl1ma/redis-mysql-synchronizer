import mysql, { ConnectionOptions } from 'mysql2';

import dotenv from 'dotenv';
dotenv.config(); // Carrega as variáveis do .env para serem usadas aqui.

// Define as opções de conexão com o banco de dados MySQL utilizando o .env.
const access: ConnectionOptions = {
    host: process.env.MYSQL_HOST, //mysql host do .env
    user: process.env.MYSQL_USER, //mysql user do .env
    password: process.env.MYSQL_PASSWORD, //mysql password do .env
    database: process.env.MYSQL_DATABASE //mysql database do .env
};

// Cria e exporta a conexão com o banco de dados MySQL usando as opções definidas.
export const conn = mysql.createConnection(access);