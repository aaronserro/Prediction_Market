import { apiClient } from "../../services/api/client";
import { saveToken } from "../../services/storage/authStorage";

type LoginRequest = {
  username: string;
  password: string;
};

export async function login({ username, password }: LoginRequest) {
  const data = await apiClient.post("/auth/login", {
    username,
    password,
  });

  const token = data.token;

  if (!token) {
    throw new Error("No token returned from login response");
  }

  await saveToken(token);

  return data;
}