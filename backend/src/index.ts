import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { connectToDatabase } from "./lib/mongodb.js";
import { User } from "./models/User.js";
import "dotenv/config";
import getGeminiResponse from "./lib/gemini-pro.js";

const app = new Hono();

app.use(async (c, next) => {
    try {
        await connectToDatabase();
        return next();
    } catch (error) {
        return c.json({ error: "Database connection failed" }, 500);
    }
});

app.get("/users/:id", async (c) => {
    try {
        const { id } = c.req.param();
        const user = (await User.find({ _id: id }))[0];
        return c.json(user);
    } catch (error) {
        return c.json({ error: "Failed to fetch users" }, 500);
    }
});

app.post("/users", async (c) => {
    try {
        const body = await c.req.json();
        const user = new User(body);
        await user.save();
        return c.json(user, 201);
    } catch (error) {
        return c.json({ error: "Failed to create user" }, 500);
    }
});
app.post("/gemini", async (c) => {
    try {
        const body = await c.req.json();
        console.log("Received body:", body);
        const responding = await getGeminiResponse(body.prompt);
        return c.json(responding, 200);
    } catch (error) {
        return c.json({ error: "Failed to create user" }, 500);
    }
});

app.patch("/users/:id/claims", async (c) => {
    try {
        const { id } = c.req.param();
        const claims = await c.req.json();

        if (!Array.isArray(claims) || claims.length === 0) {
            return c.json(
                { error: "Request body must be a non-empty array of claims" },
                400
            );
        }

        for (const claim of claims) {
            if (!claim.text || !claim.feedback || !claim.url) {
                return c.json(
                    { error: "Each claim must have text, feedback, and url" },
                    400
                );
            }
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $push: { claims: { $each: claims } } },
            { new: true }
        );

        if (!user) {
            return c.json({ error: "User not found" }, 404);
        }

        return c.json(user);
    } catch (error) {
        return c.json({ error: "Failed to add claims" }, 500);
    }
});

serve(
    {
        fetch: app.fetch,
        port: Number(process.env.PORT || 3000)
    },
    (info) => {
        console.log(`Server is running on http://localhost:${info.port}`);
    }
);
