#!/usr/bin/env node
// תמונת התצוגה המקדימה לוואטסאפ (docs/assets/og.png, 1200x630) מתוך tools/og.html
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url'; import { execFileSync } from 'node:child_process';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find(p => fs.existsSync(p));
const out = path.join(ROOT, 'docs', 'assets', 'og.png');
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'));
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${prof}`, '--allow-file-access-from-files', '--window-size=1200,630', '--virtual-time-budget=4000', `--screenshot=${out}`, pathToFileURL(path.join(ROOT, 'tools', 'og.html')).href], { stdio: 'ignore' });
fs.rmSync(prof, { recursive: true, force: true });
console.log('og.png:', fs.statSync(out).size, 'bytes');
