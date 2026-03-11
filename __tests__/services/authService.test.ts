import { AuthService } from "@/services/authService";

// Mock jose
jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue("mock-token"),
  })),
}));

describe("AuthService", () => {
  const validCredentials = {
    username: "admin",
    password: "jintu123",
  };

  const invalidCredentials = {
    username: "admin",
    password: "wrong-password",
  };

  it("should return token for valid credentials", async () => {
    const token = await AuthService.login(validCredentials);
    expect(token).toBe("mock-token");
  });

  it("should return null for invalid credentials", async () => {
    const token = await AuthService.login(invalidCredentials);
    expect(token).toBeNull();
  });
});
