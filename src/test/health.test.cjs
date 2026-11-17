// RED: Test should fail - backend may not be running or health endpoint may not work

const { describe, it, expect } = require("@jest/globals");

describe("Health endpoint", () => {
  it("should return 200 OK with status ok", async () => {
    const response = await fetch("http://localhost:5000/api/health");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });
});
