import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        claims: {
            type: [
                {
                    text: {
                        type: String,
                        required: true,
                    },
                    feedback: {
                        type: {
                            summary: {
                                type: String,
                                required: true,
                            },
                            rating: {
                                type: Number,
                                required: true,
                            },
                            explanation: {
                                type: String,
                                required: true,
                            },
                            sources: {
                                type: [String],
                                required: true,
                            },
                        },
                        required: true,
                    },
                    url: {
                        type: String,
                        required: true,
                    },
                },
            ],
            required: true,
            default: [],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
