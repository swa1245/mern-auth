import mongoose from "mongoose";

const connectDb = async () => {
  mongoose.connection.on("connected", () => {
    console.log("databse connected ");
  });
  await mongoose.connect(`${process.env.MONGODB_URL}/mern-auth`);
};

export default connectDb