import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import * as logger from "firebase-functions/logger";

setGlobalOptions({
  region: "europe-west1",
  maxInstances: 10,
  serviceAccount: "persecoaching@appspot.gserviceaccount.com"
});

export const ping = onRequest((req, res) => {
  logger.info("ping hit");
  res.status(200).json({ message: "Pong" });
});

