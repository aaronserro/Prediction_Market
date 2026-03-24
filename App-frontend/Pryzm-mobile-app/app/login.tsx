import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { login } from "../src/features/auth/authService";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      const user = await login({ username, password });
      console.log("Login success:", user);
      Alert.alert("Login successful");
    } catch (error: any) {
      console.log(error);
      Alert.alert("Login failed", error.message || "Unknown error");
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Pryzm Login</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, marginBottom: 20, padding: 8 }}
      />

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}