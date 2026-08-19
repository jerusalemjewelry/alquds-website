const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GOLD_API_KEY;

if (!API_KEY) {
    console.error("Error: GOLD_API_KEY environment variable is missing.");
    process.exit(1);
}

const PRICING_FILE = path.join(__dirname, '..', 'data', 'pricing.json');

async function fetchMetalPrice(symbol) {
    const url = `https://www.goldapi.io/api/${symbol}/USD`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'x-access-token': API_KEY,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${symbol}: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

function calculateChangePercent(current, open) {
    if (!open || open === 0) return 0;
    const change = ((current - open) / open) * 100;
    return parseFloat(change.toFixed(2));
}

async function updatePrices() {
    try {
        console.log("Fetching live prices from GoldAPI.io...");
        
        // Fetch all three metals concurrently
        const [goldData, silverData, platinumData] = await Promise.all([
            fetchMetalPrice('XAU'),
            fetchMetalPrice('XAG'),
            fetchMetalPrice('XPT')
        ]);

        console.log(`Gold (XAU): $${goldData.price}`);
        console.log(`Silver (XAG): $${silverData.price}`);
        console.log(`Platinum (XPT): $${platinumData.price}`);

        // Read existing pricing config to retain other settings
        const currentConfig = JSON.parse(fs.readFileSync(PRICING_FILE, 'utf-8'));

        // Update values
        currentConfig.spotPrice24kOunce = goldData.price;
        currentConfig.openingPriceGold = goldData.open_price;
        currentConfig.goldChangePercent = calculateChangePercent(goldData.price, goldData.open_price);

        currentConfig.silverPriceOunce = silverData.price;
        currentConfig.openingPriceSilver = silverData.open_price;
        currentConfig.silverChangePercent = calculateChangePercent(silverData.price, silverData.open_price);

        currentConfig.platinumPriceOunce = platinumData.price;
        currentConfig.openingPricePlatinum = platinumData.open_price;
        currentConfig.platinumChangePercent = calculateChangePercent(platinumData.price, platinumData.open_price);

        // Update timestamp with timezone
        const now = new Date();
        currentConfig.lastUpdated = now.toISOString();

        // Save back to file
        fs.writeFileSync(PRICING_FILE, JSON.stringify(currentConfig, null, 2) + "\n");

        console.log("Successfully updated data/pricing.json with live prices!");

    } catch (error) {
        console.error("Error updating prices:", error);
        process.exit(1);
    }
}

updatePrices();
