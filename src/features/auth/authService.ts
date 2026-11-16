import type { LoginRequest, LoginResponse } from "./authTypes";

export async function loginRequest(data: LoginRequest): Promise<LoginResponse> {
  // TODO: replace with  api.post("/auth/login", data)  when the backend is ready
  await new Promise((r) => setTimeout(r, 600));

  if (data.username === "admin" && data.password === "admin123") {
    return {
      token: "demo-token-123",
      user: { id: 1, username: "admin", name: "Administrator", role: "ADMIN" },
    };
  }
  throw new Error("Invalid username or password");
}