// RED: Test for Google auth config endpoint - should return googleAuth: true

const { describe, it, expect } = require("@jest/globals");

const BASE = "http://localhost:5000";

describe("Google OAuth configuration", () => {
  it("should return googleAuth: true from /api/auth/config", async () => {
    const response = await fetch(`${BASE}/api/auth/config`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.googleAuth).toBe(true);
  });
});
