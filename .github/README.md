# GitHub Actions Workflows

This directory contains GitHub Actions workflows for building and releasing the ManyJson Electron application.

## Workflows

### 1. Build Test (`build-test.yml`)

**Triggers:**
- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch

**Purpose:**
- Runs tests across all platforms (macOS, Windows, Linux)
- Builds the application to ensure it compiles correctly
- Tests Electron packaging without creating release artifacts

### 2. Build and Release (`release.yml`)

**Triggers:**
- Push of tags matching `v*` pattern (e.g., `v1.0.0`, `v0.2.1`)
- Manual workflow dispatch (for testing releases)

**Purpose:**
- Builds the application for all platforms
- Creates installers and packages:
  - **macOS**: `.dmg` and `.zip` files (both x64 and ARM64)
  - **Windows**: `.exe` installer and portable version
  - **Linux**: `.AppImage` and `.snap` packages
- Creates a GitHub release with all built artifacts

## How to Release

### Automatic Release (Recommended)

1. Update the version in `package.json`:
   ```bash
   npm version patch  # for 0.2.0 -> 0.2.1
   npm version minor  # for 0.2.0 -> 0.3.0
   npm version major  # for 0.2.0 -> 1.0.0
   ```

2. Push the tag created by npm:
   ```bash
   git push origin v0.2.1  # replace with your version
   ```

3. The workflow will automatically:
   - Build for all platforms
   - Create installers
   - Create a GitHub release
   - Upload all artifacts

### Manual Release

1. Go to the Actions tab in your GitHub repository
2. Select "Build and Release" workflow
3. Click "Run workflow"
4. Enter the version (e.g., `v0.2.1`)
5. Click "Run workflow"

## Build Artifacts

The workflows create the following artifacts:

### macOS
- `ManyJson-{version}.dmg` - Disk image for installation
- `ManyJson-{version}-mac.zip` - Portable application bundle
- Supports both Intel (x64) and Apple Silicon (ARM64)

### Windows
- `ManyJson Setup {version}.exe` - NSIS installer
- `ManyJson {version}.exe` - Portable executable

### Linux
- `ManyJson-{version}.AppImage` - Portable application
- `ManyJson_{version}_amd64.snap` - Snap package

## Requirements

### Repository Settings

Ensure the following repository settings are configured:

1. **Actions permissions**: Go to Settings → Actions → General
   - Allow "Read and write permissions"
   - Allow "Allow GitHub Actions to create and approve pull requests"

2. **Release permissions**: The `GITHUB_TOKEN` is automatically provided and has the necessary permissions for creating releases.

### Code Signing (Optional)

For production releases, consider adding code signing:

#### macOS
Add these secrets to your repository:
- `APPLE_ID`: Your Apple ID
- `APPLE_ID_PASSWORD`: App-specific password
- `CSC_LINK`: Base64-encoded .p12 certificate
- `CSC_KEY_PASSWORD`: Certificate password

#### Windows
Add these secrets:
- `CSC_LINK`: Base64-encoded .p12 certificate
- `CSC_KEY_PASSWORD`: Certificate password

## Troubleshooting

### Build Failures

1. **Node.js version**: The workflows use Node.js 18. Ensure your application is compatible.

2. **Dependencies**: Make sure all dependencies are listed in `package.json` and can be installed with `npm ci`.

3. **Tests**: The build test workflow runs `npm test`. Ensure your tests pass locally.

### Release Issues

1. **Tag format**: Release tags must match `v*` pattern (e.g., `v1.0.0`, not `1.0.0`).

2. **Permissions**: Ensure the repository has proper Actions permissions set.

3. **Artifacts**: Check the workflow logs if artifacts are missing or incorrectly named.

## Platform-Specific Notes

### macOS
- Builds support both Intel and Apple Silicon Macs
- DMG files include background images and proper layout
- ZIP files are portable and don't require installation

### Windows
- NSIS installer provides a complete installation experience
- Portable version runs without installation
- Both are signed if code signing certificates are provided

### Linux
- AppImage is the most compatible format across distributions
- Snap packages are available for Ubuntu and other snap-enabled systems
- Both formats are portable and don't require root privileges