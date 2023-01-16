// Importações
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";

// Iniciando configurações

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MongoClient

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

//Conectando ao Mongo

try {
  await mongoClient.connect();
  console.log("MongoDB Connected!");
} catch (erro) {
  res.status(500).send(erro.message);
}

db = mongoClient.db();

// Rotas

app.post("/participants", async (req, res) => {
  try {
    const participante = req.body;

    const participanteSchema = joi.object({
      name: joi.string().required(),
    });

    const validation = participanteSchema.validate(participante, {
      abortEarly: false,
    });

    if (validation.error) {
      const errors = validation.error.details.map((detail) => detail.message);
      return res.status(422).send(errors);
    }

    const resp = await db
      .collection("participants")
      .findOne({ name: participante.name });

    if (resp) {
      return res.status(409).send("Nome já em uso");
    }

    await db.collection("participants").insertOne({
      name: participante.name,
      lastStatus: Date.now(),
    });

    let message = {
      from: participante.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss"),
    };

    await db.collection("messages").insertOne({ message });

    return res.sendStatus(201);
  } catch (erro) {
    return res.status(500).send(erro.message);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participantes = await db.collection("participants").find().toArray();

    res.send(participantes);
  } catch (erro) {
    return res.status(500).send(erro.message);
  }
});

app.post("/messages", async (req, res) => {
  try {
    const message = req.body;
    const { user } = req.headers;

    const messageSchema = joi.object({
      to: joi.string().required(),
      text: joi.string().required(),
      type: joi.string().valid("message", "private-message").required(),
    });

    const validation = messageSchema.validate(message, { abortEarly: false });

    if (validation.error) {
      const errors = validation.error.details.map((detail) => detail.message);
      return res.status(422).send(errors);
    }

    const existente = await db.collection("participants").findOne({
      name: user,
    });

    if (!existente) {
      return res.status(422).send("Remetente não logado");
    }

    let messagem = {
      from: user,
      to: message.to,
      text: message.text,
      type: message.type,
      time: dayjs().format("HH:mm:ss"),
    };

    await db.collection("messages").insertOne({ messagem });

    return res.sendStatus(201);

  } catch (erro) {
    res.status(500).send(erro.message);
  }
});

// Port

const PORT = 5000;

app.listen(PORT, () => console.log(`Servidor rodando da porta ${PORT}`));
