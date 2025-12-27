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
                            changePercent: response.chp || 0,
                            success: true
                        });
                    } catch (e) {
                        console.warn(`Warning: Could not parse ${metal} response`);
                        resolve({ metal, success: false });
                    }
                } else {
                    console.warn(`Warning: ${metal} returned status ${res.statusCode} - may not be available in free tier`);
                    resolve({ metal, success: false });
                }
            });
        });

        req.on('error', error => {
            console.warn(`Warning: Network error for ${metal}`);
            resolve({ metal, success: false });
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

        // Check which metals we successfully got
        if (gold.success) {
            console.log(`✅ Gold: $${gold.price} (${gold.changePercent > 0 ? '+' : ''}${gold.changePercent}%)`);
        } else {
            console.error("❌ Failed to fetch Gold price");
        }

        if (silver.success) {
            console.log(`✅ Silver: $${silver.price} (${silver.changePercent > 0 ? '+' : ''}${silver.changePercent}%)`);
        } else {
            console.log("⚠️  Silver: Not available in free tier, using fallback");
        }

        if (platinum.success) {
            console.log(`✅ Platinum: $${platinum.price} (${platinum.changePercent > 0 ? '+' : ''}${platinum.changePercent}%)`);
        } else {
            console.log("⚠️  Platinum: Not available in free tier, using fallback");
        }

        updatePricingFile(gold, silver, platinum);
    })
    .catch(error => {
        console.error("Error fetching prices:", error.message);
        process.exit(1);
    });

function updatePricingFile(gold, silver, platinum) {
    fs.readFile(PRICING_FILE, 'utf8', (err, data) => {
        let pricing = {
            // Fallback values for Silver and Platinum
            silverPriceOunce: 30.12,
            platinumPriceOunce: 982.50,
            silverChange: 0,
            platinumChange: 0
        };

        if (!err) {
            try {
                pricing = JSON.parse(data);
            } catch (e) {
                console.log("Creating new pricing file...");
            }
        }

        // Update Gold (should always work)
        if (gold.success) {
            pricing.spotPrice24kOunce = gold.price;
            pricing.goldChange = gold.changePercent;
        }

        // Update Silver if available
        if (silver.success) {
            pricing.silverPriceOunce = silver.price;
            pricing.silverChange = silver.changePercent;
        }

        // Update Platinum if available
        if (platinum.success) {
            pricing.platinumPriceOunce = platinum.price;
            pricing.platinumChange = platinum.changePercent;
        }

        pricing.lastUpdated = new Date().toISOString();
        pricing.gramsPerOunce = 31.104;

        fs.writeFile(PRICING_FILE, JSON.stringify(pricing, null, 4), err => {
            if (err) {
                console.error("Error writing pricing file:", err);
                process.exit(1);
            }
            console.log(`\n✅ Success! Updated pricing file at ${pricing.lastUpdated}`);
            console.log(`   📊 Final prices:`);
            console.log(`   Gold: $${pricing.spotPrice24kOunce}`);
            console.log(`   Silver: $${pricing.silverPriceOunce}`);
            console.log(`   Platinum: $${pricing.platinumPriceOunce}`);
        });
    });
}
