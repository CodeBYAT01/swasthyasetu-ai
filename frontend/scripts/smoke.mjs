import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:4173';
const OUT = 'smoke';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

const shot = async (name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
const log = (message) => console.log(`✓ ${message}`);

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/app/overview');
  await page.getByText('START NEW CONSULTATION').waitFor();
  await shot('01-worker-dashboard');
  log('worker login + dashboard');

  await page.getByRole('button', { name: /START NEW CONSULTATION/ }).click();
  await page.waitForURL('**/app/patients/new**');
  await page.getByLabel('Patient name').fill('Kavya Test');
  await page.getByLabel('Age (years)').fill('34');
  await page.getByLabel('Sex (clinically relevant)').selectOption('Female');
  await page.getByLabel('Village').fill('Demo Village');
  await page.locator('input[type="checkbox"]').check();
  await shot('02-registration');
  await page.getByRole('button', { name: 'Start Consultation' }).click();
  await page.waitForURL('**/app/consultation/new?patient=*');
  log('patient registration');

  await page.getByRole('button', { name: 'Kannada sample' }).click();
  await page.getByText('ಜ್ವರ').first().waitFor().catch(() => {});
  const checks = page.locator('main input[type="checkbox"]');
  const count = await checks.count();
  for (let i = 0; i < count; i += 1) {
    const box = checks.nth(i);
    if (!(await box.isChecked())) await box.check();
  }
  await shot('03-voice-consultation');
  await page.getByRole('button', { name: 'Confirm Symptoms' }).click();
  await page.getByRole('button', { name: 'Continue to Assessment' }).click();
  await page.waitForURL('**/app/assessment?consultation=*');
  log('voice transcript + symptom confirmation');

  await page.getByLabel('Temperature (°C)').fill('38.9');
  await page.getByLabel('Pulse (BPM)').fill('118');
  await page.getByLabel('Blood pressure (mmHg) · Systolic').fill('100');
  await page.getByLabel('Blood pressure (mmHg) · Diastolic').fill('65');
  await page.getByLabel('SpO2 (%)').fill('88');
  await page.getByLabel('Respiratory rate (/min)').fill('26');
  await page.getByText('Emergency warning').first().waitFor();
  await shot('04-assessment-emergency');
  await page.getByRole('button', { name: 'Save Assessment' }).click();
  await page.getByText('Saved locally').waitFor();
  log('vitals + simulated emergency warning + local save');

  await page.getByRole('button', { name: 'Create Referral' }).click();
  await page.getByLabel('Referral reason').fill('Emergency drill: low SpO2 with fever and breathlessness. Request urgent specialist review.');
  await page.getByRole('button', { name: 'Submit Referral' }).click();
  await page.waitForURL('**/app/referrals/*');
  await shot('05-referral-detail');
  log('referral created and submitted');

  await page.getByRole('link', { name: 'Sync Center' }).click();
  await page.waitForURL('**/app/sync');
  await page.getByRole('button', { name: 'Synchronize Now' }).click();
  await page.getByText(/synchronized with the demonstration server|No records were waiting/).waitFor();
  await shot('06-sync-center');
  log('synchronization simulation');

  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForURL('**/login');
  await page.getByRole('button', { name: /Doctor \/ Specialist/ }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/app/overview');
  await page.getByRole('heading', { name: 'Incoming referrals' }).waitFor();
  await shot('07-doctor-dashboard');
  log('doctor login + dashboard');

  await page.getByRole('link', { name: 'Incoming Referrals' }).click();
  await page.waitForURL('**/app/review');
  await page.getByRole('button', { name: 'Open case' }).first().click();
  await page.waitForURL('**/app/review/*');
  await page.getByLabel('Clinical comments').fill('Reviewed the consultation transcript and simulated warning. Patient requires urgent in-person assessment.');
  await page.getByLabel('Recommended next steps').fill('Arrange immediate transport, monitor oxygen saturation, and follow local emergency protocol.');
  await shot('08-doctor-review');
  await page.getByRole('button', { name: 'Submit Review' }).click();
  await page.waitForURL('**/app/completed');
  await page.getByText('Reviewed the consultation transcript').waitFor();
  await shot('09-completed-reviews');
  log('doctor specialist review submitted');

  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForURL('**/login');
  await page.getByRole('button', { name: /Administrator/ }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/app/overview');
  await page.getByText('Administrative shortcuts').waitFor();
  await page.getByRole('link', { name: 'User management' }).first().click();
  await page.waitForURL('**/app/admin/users');
  await page.getByRole('button', { name: 'Add user' }).click();
  await page.getByLabel('Full name').fill('Demo Admin Test');
  await page.getByLabel('Email').fill('demo.admin.test@example.org');
  await page.getByRole('button', { name: 'Create user' }).click();
  await page.getByText('Demo Admin Test').waitFor();
  await shot('10-admin-users');
  log('admin login + user registration');
} catch (error) {
  errors.push(`flow: ${error.message}`);
  await shot('error-state');
  console.error(error);
} finally {
  console.log('\n--- Browser errors ---');
  console.log(errors.length ? errors.join('\n') : 'None');
  await browser.close();
  if (errors.some((entry) => entry.startsWith('flow:') || entry.startsWith('pageerror:'))) process.exitCode = 1;
}
