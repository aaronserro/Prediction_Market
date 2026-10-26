import { FIXTURE_DATA_ENABLED } from "../../constants/config";
import { apiClient } from "../../services/api/client";
import { saveToken } from "../../services/storage/authStorage";

type LoginRequest = {
  username: string;
  password: string;
};

export async function login({ username, password }: LoginRequest) {
  if (FIXTURE_DATA_ENABLED) {
    if (!username.trim() || !password) throw new Error("Enter your username and password.");
    const data = { token: "fixture-session-token" };
    await saveToken(data.token);
    return data;
  }

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