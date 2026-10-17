const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'client');
const androidDir = path.join(clientDir, 'android');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

console.log('====================================================');
console.log('  Swiggy Instamart Rack Audit - Android APK Builder  ');
console.log('====================================================');

function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}`);
}

function getApiBaseUrl() {
  if (process.env.AUDIT_API_BASE_URL) return process.env.AUDIT_API_BASE_URL;

  const networkAddresses = Object.values(os.networkInterfaces()).flat();
  const lanAddress = networkAddresses.find(({ address, family, internal }) =>
    family === 'IPv4' && !internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address)
  );

  if (!lanAddress) {
    throw new Error('No private LAN IPv4 address found. Set AUDIT_API_BASE_URL, for example http://192.168.1.12:5000/api.');
  }

  return `http://${lanAddress.address}:5000/api`;
}

try {
  const apiBaseUrl = getApiBaseUrl();
  console.log(`Using backend API: ${apiBaseUrl}`);
  run(npmCommand, ['run', 'build'], clientDir, {
    ...process.env,
    VITE_API_BASE_URL: apiBaseUrl
  });
  run(npxCommand, ['cap', 'sync', 'android'], clientDir);
  run(gradleCommand, ['assembleDebug'], androidDir);

  const builtApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  if (!fs.existsSync(builtApk)) throw new Error(`Gradle did not create the expected APK: ${builtApk}`);

  const outputPaths = [
    path.join(rootDir, 'Swiggy_Instamart_Rack_Audit.apk'),
    path.join(rootDir, 'uploads', 'Swiggy_Instamart_Rack_Audit.apk'),
    path.join(clientDir, 'dist', 'Swiggy_Instamart_Rack_Audit.apk')
  ];

  for (const outputPath of outputPaths) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.copyFileSync(builtApk, outputPath);
  }

  const sizeKb = (fs.statSync(builtApk).size / 1024).toFixed(1);
  console.log(`\nSUCCESS! Generated signed debug APK (${sizeKb} KB)`);
  console.log(`  ${path.join(rootDir, 'Swiggy_Instamart_Rack_Audit.apk')}`);
} catch (err) {
  console.error('\nAPK build failed:', err.message);
  console.error('Install the Android SDK and set ANDROID_HOME (or sdk.dir in client/android/local.properties), then rerun this script.');
  process.exit(1);
}
