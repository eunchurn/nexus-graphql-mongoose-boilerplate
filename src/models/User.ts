import { Schema, model, Document, Model } from "mongoose";

const UserSchema = new Schema<UserDocument, UserModel>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  }
});

export interface UserDocument extends Document {
  email: string;
  name: string;
}

export type UserModel = Model<UserDocument>;

export const User = model<UserDocument, UserModel>("User", UserSchema);