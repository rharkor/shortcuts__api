const { Client } = require("pg");
const client = new Client({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
});

const connect = async () => {
  client.connect();
  await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  await client.query(`CREATE TABLE IF NOT exists users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password text NOT NULL 
    );`);
  await client.query(`create table if not exists links (
        id SERIAL primary key,
        id_user int,
        description text,
        url text,
        constraint fk_user foreign key(id_user) references users(id) 
    );`);
};

module.exports = {
  connect,
  client,
};
