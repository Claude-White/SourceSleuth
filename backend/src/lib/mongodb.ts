import mongoose from "mongoose";

let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
    if (cachedConnection) {
        return cachedConnection;
    }

    try {
        const connection = await mongoose.connect(
            "mongodb+srv://SourceSleuth:Source-Sleuth-Jachacks817@sourcesleuth.jd3u7p3.mongodb.net/SourceSleuth"
        );

        cachedConnection = connection;
        console.log("Connected to MongoDB");
        return connection;
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    }
}
