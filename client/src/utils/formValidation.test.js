import { describe, expect, it } from "vitest";
import { validateLoginForm, validateRegisterForm } from "./formValidation";

describe("validateLoginForm", () => {
  it("rejects short passwords", () => {
    const result = validateLoginForm({
      email: "user@example.com",
      password: "short1",
    });
    expect(result.valid).toBe(false);
  });
});

describe("validateRegisterForm", () => {
  it("accepts valid registration payload", () => {
    const result = validateRegisterForm({
      fullName: "Jane Doe",
      username: "janedoe",
      email: "jane@example.com",
      phone: "08012345678",
      password: "password12",
    });
    expect(result.valid).toBe(true);
  });
});
