import { queryType, stringArg } from "nexus";

export const Queries = queryType({
  definition(t) {
    t.string("token", {
      args: { email: stringArg() },
      async resolve(_root, { email }, { mongoClient }) {
        const user = await mongoClient.User.findOne({ email: email || "" });
        console.log(user);
        return user?.email || ""
      }
    })
  }
})