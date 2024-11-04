import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.use("/interactions", (c, next) => {
  console.log("Middleware");
  return next();
});

app.post("/interactions", (c) => {
  return c.json({ message: "Interactions" });
});

export default app;
