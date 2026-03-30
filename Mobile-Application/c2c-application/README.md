# JWTToken Expo Client

## 1. Install

```bash
npm install
```

## 2. Environment

Create a `.env` file in this folder:

```bash
EXPO_PUBLIC_API_URL=http://localhost:8080
```

If you test on a physical phone, replace `localhost` with your computer's LAN IP:

```bash
EXPO_PUBLIC_API_URL=http://192.168.x.x:8080
```

## 3. Start

```bash
npx expo start
```

## 4. Optional targets

```bash
npx expo start --android
npx expo start --ios
npx expo start --web
```

## 5. Backend notes

Your Spring Boot backend must be reachable from the Expo app.

- Android emulator often uses `10.0.2.2:8080`
- iOS simulator can usually use `localhost:8080`
- Physical devices need your machine IP, not `localhost`

## 6. Current config sources

The app reads the API base URL in this order:

1. `EXPO_PUBLIC_API_URL`
2. `expo.extra.apiUrl` from `app.json`
3. fallback: `http://localhost:8080`
