import { mutationType, stringArg } from "nexus";

export const Mutation = mutationType({
  definition(t) {
    t.string("user", {
      args: { email: stringArg(), name: stringArg() },
      async resolve(_root, { email, name }, { mongoClient }) {
        const user = await mongoClient.User.create({ email, name })
        return user.name;
      }
    })
  }
})