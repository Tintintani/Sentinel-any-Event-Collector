import { Context, Hono } from "hono";
import { compress } from "hono/compress";
import { serve, ServerType } from "@hono/node-server";
import { SignJWT, jwtVerify } from "jose";
import { IngestionClient } from "./ingestionClient";
import logger from "./logger";
import { z } from "zod";

export const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
});

export const ingestionSchema = z.array(z.record(z.unknown()));

export type loginType = z.infer<typeof loginSchema>;
export type ingestionType = z.infer<typeof ingestionSchema>;

export class SharedServer {
    public app: Hono;
    public server?: ServerType;
    private JWT_SECRET: Uint8Array;

    constructor() {
        this.app = new Hono();
        this.app.use(compress());
        this.JWT_SECRET = new TextEncoder().encode("sentinel-any-event-collector-secret");
    }

    start(ingestionClient: IngestionClient) {
        this.server = serve(this.app);
        logger.info(`Server started on http://localhost:3000`);

        this.app.all(async (c, next) => {
            logger.info(`Received ${c.req.method} request on ${c.req.url}`);
            await next();
        });
        
        // Auth
        const authMiddleware = async (c: Context, next: () => Promise<void>) => {
            const authHeader = c.req.header("Authorization");
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const token = authHeader.split(" ")[1];

            try {
                const { payload } = await jwtVerify(token, this.JWT_SECRET);
                c.set("user", payload);
                await next();
            } catch (error) {
                return c.json({ error: "Invalid or expired token" }, 403);
            }
        };

        // Login endpoint
        this.app.post("/login", async (c) => {
            const body = await c.req.json();
            const result = loginSchema.safeParse(body);

            if (!result.success) {
                return c.json({ error: result.error.format() }, 400);
            }

            const { username, password } = result.data;

            if (username === "admin" && password === "password") {
                const token = await new SignJWT({ username })
                    .setProtectedHeader({ alg: "HS256" })
                    .setExpirationTime("1h")
                    .sign(this.JWT_SECRET);

                return c.json({ message: "Login Succesful", token });
            }

            return c.json({ error: "Invalid credentials" }, 401);
        });

        // Ingestion endpoint
        this.app.post("/data", authMiddleware, async (c) => {
            if (c.req.header("Content-Type") !== "application/json") {
                return c.json({ error: "Invalid content type" }, 400);
            }
            try {
                const queryParams = c.req.query();
                
                const body = await c.req.json(); // Parse JSON request body
                const result = ingestionSchema.safeParse(body);
                if (!result.success) {
                    return c.json({ error: result.error.format() }, 400);
                }
                const sourceType = queryParams["sourceType"] || "Custom";
                const sourceIp = c.req.header("X-Forwarded-For") || "";
                
                ingestionClient.ingest(result.data, sourceType, sourceIp);

                return c.json({ message: "Data received, Ingesting Logs" });
            } catch (error) {
                return c.json({ error: "Invalid JSON" }, 400);
            }
        });
    }
}
