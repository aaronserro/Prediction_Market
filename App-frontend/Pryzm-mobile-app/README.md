# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Fixture data mode

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_FIXTURE_DATA`:

```dotenv
EXPO_PUBLIC_FIXTURE_DATA=true
```

- `true` enables the complete local fixture experience, including the fake profile, markets, portfolio, news, wallet history, session-only trading, and synthetic live ticker.
- `false` disables every fixture-backed dataset and synthetic mutation. Login uses the live `https://api.pryzm.ca/auth/login` endpoint, while screens whose real endpoints are not configured show an explicit unavailable state.
- If the variable is missing or invalid, fixture mode is enabled to preserve the local development experience.

Expo inlines `EXPO_PUBLIC_*` values into the client bundle. Restart Metro after changing the value:

```bash
npx expo start --clear
```

Do not store secrets in `EXPO_PUBLIC_*` variables. Real market, portfolio, activity, wallet, news, notification, profile, and leaderboard endpoint contracts still need to be implemented before those screens can display live data.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
