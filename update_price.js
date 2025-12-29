const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = process.env.GOLD_API_KEY;
const PRICING_FILE = path.join(__dirname, 'data', 'pricing.json');

// Symbols to fetch
const METALS = ['XAU', 'XAG', 'XPT']; // Gold, Silver, Platinum
const CURRENCY = 'USD';

async function fetchPrice(metal) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.gold-api.com',
            path: `/api/${metal}/${CURRENCY}`,
            method: 'GET',
            headers: {
                'x-access-token': API_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const json = JSON.parse(data);
                        resolve(json);
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`API Error: ${res.statusCode} ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function main() {
    try {
        console.log('Starting price update...');
        // Read existing file
        let pricing = {};
        if (fs.existsSync(PRICING_FILE)) {
            pricing = JSON.parse(fs.readFileSync(PRICING_FILE, 'utf8'));
        }

        // Fetch prices
        const goldData = await fetchPrice('XAU');
        const silverData = await fetchPrice('XAG');
        const platinumData = await fetchPrice('XPT');

        // Update pricing object
        if (goldData.price) pricing.spotPrice24kOunce = goldData.price;
        if (silverData.price) pricing.silverPriceOunce = silverData.price;
        if (platinumData.price) pricing.platinumPriceOunce = platinumData.price;

        if (goldData.chp) pricing.goldChangePercent = goldData.chp;
        if (silverData.chp) pricing.silverChangePercent = silverData.chp;
        if (platinumData.chp) pricing.platinumChangePercent = platinumData.chp;

        pricing.lastUpdated = new Date().toISOString();

        // Write file
        fs.writeFileSync(PRICING_FILE, JSON.stringify(pricing, null, 4));
        console.log('Successfully updated prices:', pricing);

    } catch (error) {
        console.error('Failed to update prices:', error);
        process.exit(1);
    }
}

main();
