import { ApiResponder } from "@/lib/api/response";

describe("ApiResponder", () => {
  it("should return success response", async () => {
    const data = { id: 1, name: "Test" };
    const response = ApiResponder.success(data);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      message: "Success",
      data,
    });
  });

  it("should return error response", async () => {
    const response = ApiResponder.error("Something went wrong", 400);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      success: false,
      message: "Something went wrong",
    });
  });

  it("should return unauthorized response", async () => {
    const response = ApiResponder.unauthorized();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({
      success: false,
      message: "Unauthorized",
    });
  });
});
