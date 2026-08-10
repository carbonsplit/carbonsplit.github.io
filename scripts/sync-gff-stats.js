const puppeteer = require('puppeteer');
const fs = require('fs');

const GFF_EMAIL = process.env.GFF_EMAIL;
const GFF_PASSWORD = process.env.GFF_PASSWORD;

if (!GFF_EMAIL || !GFF_PASSWORD) {
  console.log('GFF credentials not set. Skipping sync.');
  process.exit(0);
}

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // 1. Navigate to login page
    console.log('Navigating to GFF login...');
    await page.goto('https://app.goatfundedfutures.com/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // 2. Fill in credentials and submit
    console.log('Filling in credentials...');
    await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="mail"]', { timeout: 15000 });

    // Try to find email and password fields
    const emailSelectors = ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="mail"]', 'input[placeholder*="Mail"]'];
    const passwordSelectors = ['input[type="password"]', 'input[name="password"]'];

    let emailField = null;
    for (const sel of emailSelectors) {
      emailField = await page.$(sel);
      if (emailField) break;
    }

    let passwordField = null;
    for (const sel of passwordSelectors) {
      passwordField = await page.$(sel);
      if (passwordField) break;
    }

    if (!emailField || !passwordField) {
      // Fallback: get all input fields
      const inputs = await page.$$('input');
      if (inputs.length >= 2) {
        emailField = inputs[0];
        passwordField = inputs[1];
      } else {
        throw new Error('Could not find login fields');
      }
    }

    await emailField.click({ clickCount: 3 });
    await emailField.type(GFF_EMAIL, { delay: 50 });
    await passwordField.click({ clickCount: 3 });
    await passwordField.type(GFF_PASSWORD, { delay: 50 });

    // Find and click submit button
    const submitButton = await page.$('button[type="submit"]') || await page.$('button');
    if (submitButton) {
      await submitButton.click();
    } else {
      await page.keyboard.press('Enter');
    }

    // 3. Wait for dashboard to load after login
    console.log('Waiting for dashboard to load...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 5000)); // Extra wait for dynamic content

    // 4. Navigate to account page if not already there
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check if we need to navigate to account details
    // Look for the account link or navigate directly
    if (!currentUrl.includes('/account/')) {
      // Try to find and click on the account
      const accountLink = await page.$('a[href*="account"]');
      if (accountLink) {
        await accountLink.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    // 5. Scrape the stats from the page
    console.log('Scraping stats...');

    const stats = await page.evaluate(() => {
      const getText = (el) => el ? el.textContent.trim() : '';
      const body = document.body.innerText;

      // Helper to extract dollar amounts
      const extractDollar = (text) => {
        const match = text.match(/\$([0-9,]+\.?\d*)/);
        return match ? parseFloat(match[1].replace(/,/g, '')) : null;
      };

      // Get all text content and try to find values
      const allText = document.body.innerText;
      const result = {};

      // Current Balance
      const balanceMatch = allText.match(/Current Balance[\s\S]*?\$([0-9,]+\.?\d*)/i);
      if (balanceMatch) result.currentBalance = parseFloat(balanceMatch[1].replace(/,/g, ''));

      // Current Equity
      const equityMatch = allText.match(/Current Equity[\s\S]*?\$([0-9,]+\.?\d*)/i);
      if (equityMatch) result.currentEquity = parseFloat(equityMatch[1].replace(/,/g, ''));

      // Daily Drawdown Left
      const dailyDDMatch = allText.match(/Daily drawdown[\s\S]*?\$([0-9,]+\.?\d*)\s*left/i);
      if (dailyDDMatch) result.dailyDrawdownLeft = parseFloat(dailyDDMatch[1].replace(/,/g, ''));

      // Daily Drawdown Limit
      const dailyLimitMatch = allText.match(/Daily drawdown[\s\S]*?\$([0-9,]+\.?\d*)\s*$/m);
      if (dailyLimitMatch) result.dailyDrawdownLimit = parseFloat(dailyLimitMatch[1].replace(/,/g, ''));

      // Maximum Drawdown Left
      const maxDDMatch = allText.match(/Maximum drawdown[\s\S]*?\$([0-9,]+\.?\d*)\s*left/i);
      if (maxDDMatch) result.maxDrawdownLeft = parseFloat(maxDDMatch[1].replace(/,/g, ''));

      // Maximum Drawdown Limit
      const maxLimitMatch = allText.match(/Maximum drawdown[\s\S]*?\$([0-9,]+\.?\d*)\s*$/m);
      if (maxLimitMatch) result.maxDrawdownLimit = parseFloat(maxLimitMatch[1].replace(/,/g, ''));

      // Consistency
      const consistencyMatch = allText.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)%/);
      if (consistencyMatch) {
        result.consistency = parseFloat(consistencyMatch[1]);
        result.consistencyMax = parseFloat(consistencyMatch[2]);
      }

      return result;
    });

    console.log('Scraped stats:', JSON.stringify(stats, null, 2));

    // 6. Validate we got real data
    if (!stats.currentBalance && !stats.currentEquity) {
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
      console.log('Could not scrape stats. Saved debug screenshot.');

      // Try alternative: scrape all dollar amounts from the page
      const allDollars = await page.evaluate(() => {
        const text = document.body.innerText;
        const matches = [...text.matchAll(/\$([0-9,]+\.?\d*)/g)];
        return matches.map(m => parseFloat(m[1].replace(/,/g, '')));
      });
      console.log('All dollar amounts found on page:', allDollars);
      console.log('Page text (first 2000 chars):', await page.evaluate(() => document.body.innerText.substring(0, 2000)));

      process.exit(0);
    }

    // 7. Update stats.json
    const statsPath = 'public/data/stats.json';
    const currentStats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));

    if (stats.currentBalance) currentStats.currentBalance = stats.currentBalance;
    if (stats.currentEquity) currentStats.currentEquity = stats.currentEquity;
    if (stats.dailyDrawdownLeft) currentStats.dailyDrawdownLeft = stats.dailyDrawdownLeft;
    if (stats.dailyDrawdownLimit) currentStats.dailyDrawdownLimit = stats.dailyDrawdownLimit;
    if (stats.maxDrawdownLeft) currentStats.maxDrawdownLeft = stats.maxDrawdownLeft;
    if (stats.maxDrawdownLimit) currentStats.maxDrawdownLimit = stats.maxDrawdownLimit;
    if (stats.consistency) currentStats.consistency = stats.consistency;
    if (stats.consistencyMax) currentStats.consistencyMax = stats.consistencyMax;
    currentStats.lastUpdated = new Date().toISOString();

    fs.writeFileSync(statsPath, JSON.stringify(currentStats, null, 2) + '\n');
    console.log('Successfully updated stats.json!');
    console.log('New stats:', JSON.stringify(currentStats, null, 2));

  } catch (err) {
    console.error('Scraper error:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
