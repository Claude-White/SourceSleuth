import mongoose from "mongoose";
import "dotenv/config";

let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
    if (cachedConnection) {
        return cachedConnection;
    }

    try {
        const connection = await mongoose.connect(process.env.MONGODB_URL!);

        cachedConnection = connection;
        console.log("Connected to MongoDB");
        return connection;
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    }
}
