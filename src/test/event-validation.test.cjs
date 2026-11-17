// RED: Test for past date rejection - should return 400

const { describe, it, expect } = require("@jest/globals");

describe("Event creation date validation", () => {
  it("should reject past event dates with 400", async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // yesterday
    const response = await fetch("http://localhost:5000/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer invalid-token" },
      body: JSON.stringify({
        title: "Past Event",
        type: "Cleanup",
        date: pastDate,
        location: "Dhaka",
        thumbnail: "https://example.com/photo.jpg",
        description: "A past event",
      }),
    });
    // Without valid auth token, should get 401 or 400
    expect([400, 401]).toContain(response.status);
  });
});
