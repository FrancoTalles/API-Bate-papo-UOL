import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

try {
    await mongoClient.connect();
    console.log("MongoDB Connected!");
    db = mongoClient.db();
} catch (err){
    console.log(err.message);
}

const app = express();
app.use(cors());
app.use(express.json());




const PORT = 5000;

app.listen(PORT, () => console.log(`Servidor rodando da porta ${PORT}`));
