import { chromium } from 'playwright-core';

const BASE = 'http://localhost:4173';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Sign in', exact: true }).click();
await page.waitForURL('**/app/overview');
await page.getByRole('button', { name: /START NEW CONSULTATION/ }).waitFor();

const lang = page.locator('header select').first();
for (const [code, marker] of [['kn', 'ಅವಲೋಕನ'], ['hi', 'अवलोकन'], ['en', 'Overview']]) {
  await lang.selectOption(code);
  await page.waitForTimeout(300);
  const body = await page.locator('body').innerText();
  if (!body.includes(marker)) errors.push(`language ${code}: marker "${marker}" not found`);
  else console.log(`✓ language switch → ${code}`);
}

console.log('\n--- Issues ---');
console.log(errors.length ? errors.join('\n') : 'None');
await browser.close();
if (errors.length) process.exitCode = 1;
