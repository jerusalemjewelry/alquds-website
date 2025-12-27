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

// Fetch price for a specific metal
function fetchMetalPrice(metal) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'www.goldapi.io',
            path: `/api/${metal}/USD`,
            method: 'GET',
            headers: {
                'x-access-token': API_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, res => {
            let data = '';

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        resolve({
                            metal: metal,
                            price: response.price,
                            change: response.ch || 0,
                            changePercent: response.chp || 0
                        });
                    } catch (e) {
                        reject(new Error(`Error parsing ${metal} response: ${e.message}`));
                    }
                } else {
                    reject(new Error(`API Error for ${metal}: StatusCode ${res.statusCode}`));
                }
            });
        });

        req.on('error', error => {
            reject(new Error(`Network Error for ${metal}: ${error.message}`));
        });

        req.end();
    });
}

console.log("Fetching live metal prices...");

// Fetch all three metals
Promise.all([
    fetchMetalPrice('XAU'), // Gold
    fetchMetalPrice('XAG'), // Silver
    fetchMetalPrice('XPT')  // Platinum
])
    .then(results => {
        const [gold, silver, platinum] = results;

        console.log(`Gold: $${gold.price} (${gold.changePercent > 0 ? '+' : ''}${gold.changePercent}%)`);
        console.log(`Silver: $${silver.price} (${silver.changePercent > 0 ? '+' : ''}${silver.changePercent}%)`);
        console.log(`Platinum: $${platinum.price} (${platinum.changePercent > 0 ? '+' : ''}${platinum.changePercent}%)`);

        updatePricingFile(gold, silver, platinum);
    })
    .catch(error => {
        console.error("Error fetching prices:", error.message);
        process.exit(1);
    });

function updatePricingFile(gold, silver, platinum) {
    fs.readFile(PRICING_FILE, 'utf8', (err, data) => {
        let pricing = {};

        if (!err) {
            try {
                pricing = JSON.parse(data);
            } catch (e) {
                console.log("Creating new pricing file...");
            }
        }

        // Update with new prices
        pricing.spotPrice24kOunce = gold.price;
        pricing.silverPriceOunce = silver.price;
        pricing.platinumPriceOunce = platinum.price;
        pricing.goldChange = gold.changePercent;
        pricing.silverChange = silver.changePercent;
        pricing.platinumChange = platinum.changePercent;
        pricing.lastUpdated = new Date().toISOString();
        pricing.gramsPerOunce = 31.104;

        fs.writeFile(PRICING_FILE, JSON.stringify(pricing, null, 4), err => {
            if (err) {
                console.error("Error writing pricing file:", err);
                process.exit(1);
            }
            console.log(`Success! Updated all metal prices at ${pricing.lastUpdated}`);
        });
    });
}

