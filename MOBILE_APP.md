# Android app (Capacitor)

Same React code = web + Android app. Web par kuch nahi badla (native code `Capacitor.isNativePlatform()` se guarded hai).

## Ek baar setup (apne PC par)
1. Android Studio install karo (SDK + JDK 17+ saath aata hai).
2. `npm install`

## Build / run
```
npm run android      # web build -> android me copy -> Android Studio khulta hai
```
Android Studio me: device/emulator chuno -> Run ▶.

Sirf code sync karna ho: `npm run cap:sync`

## Play Store ke liye
- Android Studio -> Build -> Generate Signed Bundle (AAB). **Keystore file kho mat dena** (git me mat daalna, `.gitignore` me hai).
- App icon/splash abhi Capacitor ka default hai. Apna logo 1024x1024 se: `npx @capacitor/assets generate --android`.
- `appId`: `tech.schooloffice.teacher` (`capacitor.config.ts`). Store par ek baar chhapne ke baad badalna mushkil hai.

## API URL
Default `src/api/client.ts` me hai. Alag URL ke liye `.env`: `VITE_API_URL=https://.../api`

## Backend
CORS me native origins (`https://localhost`, `capacitor://localhost`) allow hain (`server.js`).

## Abhi nahi hai
- Push notifications (app band hone par): Firebase (FCM) + staff device tokens chahiye.
- iOS: Mac + Apple Developer account chahiye (`npm i @capacitor/ios && npx cap add ios`).
