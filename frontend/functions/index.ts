import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { Request, Response } from "express";

initializeApp();

export const ping = onRequest((req: Request, res: Response) => {
  res.status(200).send({ message: "Pong" });
});
