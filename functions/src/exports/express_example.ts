import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";

// Auth Middleware
const auth = (request: any, response: any, next: any) => {
  if (!request.headers.authorization) {
    response.status(400).send("unauthorized");
  }
  next();
};

// Multi Route ExpressJS HTTP Function
const app = express();
app.use(cors({ origin: true }));
app.use(auth);

app.get("/cat", (request, response) => {
  response.send("CAT");
});

app.get("/dog", (request, response) => {
  response.send("DOG");
});

export const api = functions.https.onRequest(app);
