import { Request, Response } from "express";
import "./mongo";
import * as mongoClient from "../models"

interface ExpressContext {
  request: Request;
  response: Response;
}

export interface Context extends ExpressContext {
  mongoClient: mongoClient.MongoModel;
}

export async function context(req: ExpressContext): Promise<Context> {
  const { request, response } = req;
  return {
    request,
    response,
    mongoClient,
  }
}