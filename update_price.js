const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const API_KEY = process.env.GOLD_API_KEY;
const PRICING_FILE = path.join(__dirname, 'data', 'pricing.json');

if (!API_KEY) {
    console.error("Error: GOLD_API_KEY environment variable is missing.");
    process.exit(1);
}

const options = {
    hostname: 'www.goldapi.io',
    path: '/api/XAU/USD',
    method: 'GET',
    headers: {
        'x-access-token': API_KEY,
        'Content-Type': 'application/json'
    }
};

console.log("Fetching live gold price...");

const req = https.request(options, res => {
    let data = '';

    res.on('data', chunk => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const response = JSON.parse(data);
                const spotPrice = response.price; // price per ounce in USD. Check API docs if it's per ounce or gram. usually XAU/USD is per ounce.

                if (spotPrice) {
                    console.log(`Received Spot Price: $${spotPrice}`);
                    updatePricingFile(spotPrice);
                } else {
                    console.error("Error: Price not found in response.");
                    console.error(data);
                    process.exit(1);
                }
            } catch (e) {
                console.error("Error parsing JSON:", e);
                process.exit(1);
            }
        } else {
            console.error(`API Error: StatusCode ${res.statusCode}`);
            console.error(data);
            process.exit(1);
        }
    });
});

req.on('error', error => {
    console.error("Network Error:", error);
    process.exit(1);
});

req.end();

function updatePricingFile(newPrice) {
    fs.readFile(PRICING_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading pricing file:", err);
            process.exit(1);
        }

        try {
            const pricing = JSON.parse(data);
            const oldPrice = pricing.spotPrice24kOunce;

            pricing.spotPrice24kOunce = newPrice;
            pricing.lastUpdated = new Date().toISOString();

            fs.writeFile(PRICING_FILE, JSON.stringify(pricing, null, 4), err => {
                if (err) {
                    console.error("Error writing pricing file:", err);
                    process.exit(1);
                }
                console.log(`Success! Updated price from $${oldPrice} to $${newPrice}`);
            });
        } catch (e) {
            console.error("Error parsing pricing file:", e);
            process.exit(1);
        }
    });
}
