# LifeVault

LifeVault is a personal organizer built with Expo and React Native. It brings notes, reminders, schedules, credentials, and personal files together in one mobile-first app.

## Features

- **Notes & memories** — write, search, categorize, and favorite notes.
- **Reminders** — organize activities by category, track completion, and schedule local notifications.
- **Medicine manager** — keep medication details and schedules, with optional daily notifications.
- **Important dates** — save special dates and choose how many days in advance to receive a local notification.
- **Assignment manager** — organize assignments by subject, due date, and priority, and track completion.
- **Password vault** — save and search credentials; access is protected by device biometric authentication when available.
- **Document & media vault** — add images, videos, and documents; organize personal and professional files, search, favorite, rename, and preview supported media. The vault can be locked with a 4- or 6-digit PIN and uses fingerprint authentication when available.
- **Home dashboard** — see note and reminder counts, completion totals, and upcoming reminders.
- **Calendar screen** — currently a basic placeholder for future event and deadline planning.

## Requirements

- Node.js and npm
- Android or iOS device/simulator, or a web browser for the web target

## Getting started

```bash
git clone https://github.com/Yashodha2001/LifeVault.git
cd LifeVault
npm ci
npx expo start
```

Once Expo starts, follow the terminal prompts to open the app on a device, simulator, or web browser. Some device features—such as biometric authentication and local notifications—depend on platform support and user permissions.

## Development commands

```bash
npm run start          # Start the Expo development server
npm run android        # Start on Android
npm run ios            # Start on iOS
npm run web            # Start for web
npm run lint           # Run Expo lint
npx tsc --noEmit       # Type-check the TypeScript project
```

## Project structure

```text
src/
  app/          Expo Router screens
  components/   Shared UI components
  constants/    App-wide constants and theme
  database/     SQLite database and data operations
  hooks/        Shared React hooks
  utils/        File storage, vault PIN, and notification helpers
assets/         App icons and images
app.json        Expo app configuration
```

LifeVault uses Expo Router for navigation, SQLite for on-device records, and Expo SecureStore for password values and the document-vault PIN data.

## Privacy and data

LifeVault is designed for local use; this repository does not configure an account service or cloud synchronization. Notes, reminders, schedules, assignments, and vault metadata are stored in the app's local SQLite database. Password values and the document-vault PIN data use Expo SecureStore. Imported files are copied into the app's local document directory.

The document-vault PIN controls access to the vault, but imported files are **not encrypted by the app**. A PIN or biometric lock should not be treated as file encryption. Keep a separate backup of important information: removing the app or losing the device may make local data unavailable.

## License

See [LICENSE](LICENSE).
