import mongoose from "mongoose"
const DB_NAME = "CodeSync"

const connectDB = async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("Mongodb connected");
    }
    catch(e){
        console.log("mongodb connection error",e);
        process.exit(1);
    }
}

export default connectDB;