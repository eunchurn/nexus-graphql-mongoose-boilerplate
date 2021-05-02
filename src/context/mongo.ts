import mongoose, { CallbackError } from "mongoose";
import "dotenv/config";

const uri = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.MONGO_URL}:${process.env.MONGO_PORT}/?authMechanism=DEFAULT`;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});
// mongoose.set("debug", true);
mongoose.set("useCreateIndex", true);
const db = mongoose.connection;

const handleOpen = () => console.log("🚀 Connected to MongoDB");
const handleError = (error: CallbackError) =>
  console.log(`❌ Error on DB connection: ${error}`);

db.once("open", handleOpen);
db.on("error", handleError);