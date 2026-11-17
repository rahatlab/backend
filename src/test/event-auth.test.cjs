// RED: Test event creation without auth (should be 401) and invalid body

const { describe, it, expect } = require("@jest/globals");

const BASE = "http://localhost:5000";

describe("Event creation without auth", () => {
  it("should return 401 when creating event without token", async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
    const response = await fetch(`${BASE}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "No Auth Event",
        type: "Cleanup",
        date: futureDate,
        location: "Dhaka",
        thumbnail: "https://example.com/photo.jpg",
        description: "No auth event",
      }),
    });
    expect(response.status).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
    const response = await fetch(`${BASE}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid-token-123",
      },
      body: JSON.stringify({
        title: "Invalid Token Event",
        type: "Cleanup",
        date: futureDate,
        location: "Dhaka",
        thumbnail: "https://example.com/photo.jpg",
        description: "Invalid token event",
      }),
    });
    expect(response.status).toBe(401);
  });
});
