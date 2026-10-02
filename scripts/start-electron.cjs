const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawn } = require('node:child_process');

const projectDir = path.resolve(__dirname, '..');

function developmentExecutable() {
  const electron = require('electron');
  if (process.platform !== 'darwin') return electron;

  // El Dock toma el nombre del bundle, no el título de BrowserWindow.
  const version = require('electron/package.json').version;
  const bundle = path.join(os.tmpdir(), `trazuvia-electron-${version}-${process.arch}`, 'Trazuvia.app');
  const executable = path.join(bundle, 'Contents', 'MacOS', 'Electron');
  const marker = path.join(path.dirname(bundle), 'ready');
  if (!fs.existsSync(marker)) {
    fs.rmSync(bundle, { recursive: true, force: true });
    fs.cpSync(path.resolve(electron, '../../..'), bundle, { recursive: true, verbatimSymlinks: true });
    const plist = path.join(bundle, 'Contents', 'Info.plist');
    for (const [key, value] of Object.entries({
      CFBundleName: 'Trazuvia',
      CFBundleDisplayName: 'Trazuvia',
      CFBundleIdentifier: 'com.trazuvia.designer.dev'
    })) {
      execFileSync('/usr/bin/plutil', ['-replace', key, '-string', value, plist]);
    }
    execFileSync('/usr/bin/codesign', ['--force', '--sign', '-', bundle], { stdio: 'pipe' });
    execFileSync('/usr/bin/codesign', ['--verify', bundle], { stdio: 'pipe' });
    fs.writeFileSync(marker, version);
  }
  return executable;
}

if (require.main === module) {
  const child = spawn(developmentExecutable(), [projectDir, ...process.argv.slice(2)], { stdio: 'inherit' });
  child.on('error', error => { console.error(error); process.exitCode = 1; });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exitCode = code;
  });
}

module.exports = { developmentExecutable };
