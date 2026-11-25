#!/usr/bin/env node
/**
 * Wrapper around the Vite CLI that keeps esbuild's temp files inside the repo.
 *
 * Why this exists:
 *   On some Windows machines (typically with an aggressive antivirus / Defender
 *   real-time protection) esbuild cannot delete the temporary binary it creates
 *   under %LOCALAPPDATA%\Temp, so `vite build` aborts with
 *       [vite:esbuild-transpile] remove C:\...\Temp\esbuild-<hash>: Access is denied
 *   and leaves a half-written `dist/` behind (no index.html, no assets).
 *
 *   Pointing TEMP/TMP at a project-local folder keeps those files inside the
 *   workspace, where the scanner does not hold a lock on them, and the build
 *   completes normally on every platform.
 *
 * Usage:
 *   node scripts/build.mjs                     # builds the main app
 *   node scripts/build.mjs --config admin/vite.config.ts
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmpDir = path.join(rootDir, '.tmp-build');
const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

mkdirSync(tmpDir, { recursive: true });

const args = [viteBin, 'build', ...process.argv.slice(2)];

const child = spawn(process.execPath, args, {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    TEMP: tmpDir,
    TMP: tmpDir,
    TMPDIR: tmpDir,
  },
});

child.on('error', (error) => {
  console.error('Failed to start the Vite build:', error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Vite build terminated by signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
