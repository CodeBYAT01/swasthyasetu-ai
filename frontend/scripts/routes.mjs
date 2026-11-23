import { chromium } from 'playwright-core';

const BASE = 'http://localhost:4173';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (err) => errors.push(`${page.url()} :: pageerror: ${err.message}`));
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`${page.url()} :: console: ${msg.text().slice(0, 200)}`); });

async function login(role) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  if (page.url().includes('/app/')) {
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');
  }
  await page.getByRole('button', { name: role }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/app/overview');
}

async function visit(path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  const text = (await page.locator('main').innerText().catch(() => '')) || '';
  if (text.trim().length < 20) errors.push(`${path} :: empty main content`);
  console.log(`✓ ${path}`);
}

try {
  await login(/Frontline Health Worker/);
  for (const path of ['/app/overview', '/app/patients', '/app/patients/new', '/app/consultation/new', '/app/assessment', '/app/referrals', '/app/sync', '/app/settings', '/app/review', '/app/completed']) {
    await visit(path);
  }

  await page.goto(`${BASE}/app/patients`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /view/i }).first().click();
  await page.waitForURL('**/app/patients/*');
  await visit(new URL(page.url()).pathname);

  await page.goto(`${BASE}/app/referrals`, { waitUntil: 'networkidle' });
  await page.locator('main button', { hasText: 'REF-' }).first().click();
  await page.waitForURL('**/app/referrals/*');
  await visit(new URL(page.url()).pathname);

  await login(/Administrator/);
  for (const path of ['/app/overview', '/app/admin/users', '/app/admin/centres', '/app/admin/permissions', '/app/admin/rules', '/app/admin/audit', '/app/admin/sync', '/app/settings']) {
    await visit(path);
  }
} catch (error) {
  errors.push(`flow: ${error.message}`);
}

console.log('\n--- Issues ---');
console.log(errors.length ? errors.join('\n') : 'None');
await browser.close();
if (errors.length) process.exitCode = 1;
