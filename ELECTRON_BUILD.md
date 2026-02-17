# Building as Windows .exe

This guide explains how to convert the project into a Windows executable using Electron.

## Quick Start

### 1. Build and run in development
```bash
npm run electron:dev
```
This cleans, builds the Next.js app, and launches it in an Electron window.

### 2. Create the .exe installer
```bash
npm run electron:build
```
This produces:
- **Installer**: `dist/Wedding Horoscope Matcher Setup x.x.x.exe` (NSIS installer)
- **Portable**: `dist/win-unpacked/Wedding Horoscope Matcher.exe` (run without installing)

## Commands

| Command | Description |
|--------|-------------|
| `npm run electron:start` | Run Electron app (requires `npm run build` first) |
| `npm run electron:dev` | Clean + build + run in one step |
| `npm run electron:build` | Build Next.js + create Windows .exe |

## How it works

1. **Electron** wraps your Next.js app in a desktop window
2. The **Next.js server** runs in the background on port 3000
3. Electron loads the app at `http://localhost:3000`

## Requirements

- Node.js installed
- Windows (for .exe build)
- Run `npm install` before building

## Troubleshooting ERR_ELECTRON_BUILDER_CANNOT_EXECUTE

If you get this error, the `dist` folder is usually locked by another process. Use the safe build script:

```powershell
# Close the app first, then run:
npm run electron:build:safe
```

Or manually:
1. **Close** Wedding Horoscope Matcher completely (check Task Manager)
2. **Close** any File Explorer window showing the `dist` folder
3. Run: `npm run electron:build`

If it still fails, add an antivirus exclusion for the project folder, or run the build as Administrator.

## Data storage

The app stores data in:
- **Windows**: `%LOCALAPPDATA%\wedding-horoscope\data\`
- Database: `horoscope.db`
- Uploads: `wedding-horoscope\uploads\`
