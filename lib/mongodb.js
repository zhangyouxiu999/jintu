import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";  // 你的 Docker 容器地址
const options = {};

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export default clientPromise;
