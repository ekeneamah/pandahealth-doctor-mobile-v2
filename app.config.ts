import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  android: {
    ...config.android,
    // This must be a PATH. With EAS "file" env var, this becomes a path on the build machine.
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? "./android/app/google-services.json",
  },
});
