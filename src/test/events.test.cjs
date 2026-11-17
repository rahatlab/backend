// RED: Test for public events list endpoint

const { describe, it, expect } = require("@jest/globals");

describe("Events list endpoint", () => {
  it("should return 200 with an array of events", async () => {
    const response = await fetch("http://localhost:5000/api/events");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("should return 404 for non-existent event detail", async () => {
    const response = await fetch("http://localhost:5000/api/events/000000000000000000000000");
    expect(response.status).toBe(404);
  });

  it("should return 200 for recent events", async () => {
    const response = await fetch("http://localhost:5000/api/events/recent");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
