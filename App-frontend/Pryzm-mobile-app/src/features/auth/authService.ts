import { apiClient } from "../../services/api/client";
import { saveToken } from "../../services/storage/authStorage";

type LoginRequest = {
  email: string;
  password: string;
};

export async function login({ email, password }: LoginRequest) {
  const data = await apiClient.post("/auth/login", {
    email,
    password,
  });

  const token = data.token;

  if (!token) {
    throw new Error("No token returned from login response");
  }

  await saveToken(token);

  return data;
}