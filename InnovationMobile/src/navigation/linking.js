// ─────────────────────────────────────────────────────────────
// navigation/linking.js
// ─────────────────────────────────────────────────────────────
// Deep-link config for the React Native app. Email links land on
// `innovationmobile://verify?token=…` and
// `innovationmobile://reset-password?token=…`; this file maps those
// URL paths to the VerifyEmailScreen and ResetPasswordScreen routes
// inside the single NavigationContainer in App.js.
//
// `Linking.createURL('/')` is included alongside the custom scheme
// so the same flows can be exercised under Expo Go — there a link
// would arrive as `exp://…/--/verify?token=…`. The bare scheme
// prefix only resolves in a dev build or standalone binary.
//
// Query params flow into `route.params` automatically, so the
// target screens read `route.params?.token` (and never log it).
// ─────────────────────────────────────────────────────────────
import * as Linking from 'expo-linking';

export const linking = {
  prefixes: ['innovationmobile://', Linking.createURL('/')],
  config: {
    screens: {
      VerifyEmail: 'verify',
      ResetPassword: 'reset-password',
    },
  },
};
