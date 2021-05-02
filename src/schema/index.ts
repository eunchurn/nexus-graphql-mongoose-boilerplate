import { makeSchema } from "nexus";
import * as types from "./types"
import path from "path";

export const schema = makeSchema({
  types,
  outputs: {
    schema: path.join(__dirname, "../generated/schema.graphql"),
    typegen: path.join(__dirname, "../generated/types.ts")
  },
  contextType: {
    module: require.resolve("../context"),
    export: "Context",
  }
})