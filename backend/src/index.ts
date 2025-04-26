import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { connectToDatabase } from "./lib/mongodb.js";
import { User } from "./models/User.js";
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

app.get("/users", async (c) => {
    try {
        const users = await User.find({});
        return c.json(users);
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

serve(
    {
        fetch: app.fetch,
        port: 3000,
    },
    (info) => {
        console.log(`Server is running on http://localhost:${info.port}`);
    }
);
