import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Request, Response } from "express";

admin.initializeApp();

export const ping = functions.https.onRequest((req: Request, res: Response) => {
  res.status(200).send({ message: "Pong" });
});
