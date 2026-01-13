
# Building the Facilities Wiki Desktop App

This application is built using React and Electron. Follow these steps to package the app for different operating systems.

## Prerequisites
1. **Node.js**: Ensure you have Node.js (v18+) installed.
2. **NPM**: Standard with Node.js.

## Installation
Open your terminal in the project directory and run:
```bash
npm install
```

## Running the App in Development
To test the desktop version without building:
```bash
npm start
```

## Building for Multiple Platforms

The built files will be located in the `dist/` folder.

### 1. Windows (Builds a .exe installer)
Run this command from any OS (requires `wine` on non-Windows to build, but recommended to build on Windows):
```bash
npm run build:win
```

### 2. macOS (Builds a .dmg)
*Note: You must be on a macOS machine to build for macOS.*
```bash
npm run build:mac
```

### 3. Linux (Builds .AppImage and .deb)
```bash
npm run build:linux
```

### 4. Build All (Parallel)
```bash
npm run build:all
```

## Troubleshooting
- **Routing**: If the screen is blank on launch, ensure `HashRouter` is used in `App.tsx` instead of `BrowserRouter`.
- **API Keys**: Ensure your environment variables for Supabase and Gemini are either hardcoded in the `lib/` files or configured via Electron's `process.env`.
- **Images**: If using local assets, ensure paths are relative (e.g., `./assets/img.png`).
