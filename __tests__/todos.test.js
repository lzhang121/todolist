const request = require("supertest");
const { app, resetTodos } = require("../src/app");

beforeEach(() => {
  resetTodos();
});

describe("GET /api/todos", () => {
  it("returns an empty array initially", async () => {
    const res = await request(app).get("/api/todos");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("POST /api/todos", () => {
  it("creates a new todo", async () => {
    const res = await request(app)
      .post("/api/todos")
      .send({ title: "Buy groceries" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 1,
      title: "Buy groceries",
      completed: false,
    });
  });

  it("rejects empty title", async () => {
    const res = await request(app).post("/api/todos").send({ title: "" });
    expect(res.status).toBe(400);
  });

  it("rejects missing title", async () => {
    const res = await request(app).post("/api/todos").send({});
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/todos/:id", () => {
  it("toggles completion", async () => {
    await request(app).post("/api/todos").send({ title: "Test todo" });
    const res = await request(app)
      .patch("/api/todos/1")
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it("returns 404 for missing todo", async () => {
    const res = await request(app)
      .patch("/api/todos/999")
      .send({ completed: true });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/todos/:id", () => {
  it("deletes a todo", async () => {
    await request(app).post("/api/todos").send({ title: "To delete" });
    const res = await request(app).delete("/api/todos/1");
    expect(res.status).toBe(204);
    const list = await request(app).get("/api/todos");
    expect(list.body).toEqual([]);
  });

  it("returns 404 for missing todo", async () => {
    const res = await request(app).delete("/api/todos/999");
    expect(res.status).toBe(404);
  });
});
