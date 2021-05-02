import { ApolloServer, Config } from "apollo-server-express";
import express from "express";
import { schema } from "./schema";
import { context } from "./context";

export async function startServer() {
  const config: Config = {
    schema,
    context,
    playground: true,
  }
  const server = new ApolloServer(config);
  // await server.start();
  const app = express();
  server.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("listen 4000")
  });

  return { server, app }
}
