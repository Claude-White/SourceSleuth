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
