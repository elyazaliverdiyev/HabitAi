const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`BROWSER ERROR: ${msg.text()}`);
            msg.args().forEach(async (arg) => {
                const jsonValue = await arg.jsonValue().catch(() => '');
                if (jsonValue) console.log(`  ARG: ${JSON.stringify(jsonValue)}`);
            });
        }
    });

    page.on('pageerror', err => {
        console.log(`PAGE EXCEPTION: ${err.toString()}`);
    });

    console.log('Navigating to app...');
    await page.goto('http://localhost:8080');

    // wait for login to appear
    try {
        await page.waitForSelector('text=Sign in with Email', { timeout: 3000 });
        console.log('Login screen reached. Signing in...');
        await page.click('text=Sign in with Email');
        await page.fill('input[type="email"]', 'test@habitai.com');
        await page.fill('input[type="password"]', 'password123'); // assuming standard test pass
        await page.click('button:has-text("Sign In")');

        console.log('Waiting for crash or load...');
        await page.waitForTimeout(5000);
    } catch (e) {
        console.log('Error during interaction:', e);
    }

    await browser.close();
})();
