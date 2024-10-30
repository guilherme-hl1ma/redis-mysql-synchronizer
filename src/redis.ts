import { createClient } from "redis";

const client = createClient();
client.on("error", (err) => console.log("Redis Client Error", err));

const connectRedis = async () => {
  await client.connect();
};

try {
  connectRedis();
} catch (e) {
  console.log(e);
}

export { client };