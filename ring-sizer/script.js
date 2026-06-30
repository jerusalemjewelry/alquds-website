// Ring Size Reference Database
// standard US sizes with their inside diameters in millimeters
const ringSizes = [
  { size: "3", diameter: 14.1 },
  { size: "3 ½", diameter: 14.5 },
  { size: "4", diameter: 14.9 },
  { size: "4 ½", diameter: 15.3 },
  { size: "5", diameter: 15.7 },
  { size: "5 ½", diameter: 16.1 },
  { size: "6", diameter: 16.5 },
  { size: "6 ½", diameter: 16.9 },
  { size: "7", diameter: 17.3 },
  { size: "7 ½", diameter: 17.7 },
  { size: "8", diameter: 18.1 },
  { size: "8 ½", diameter: 18.5 },
  { size: "9", diameter: 19.0 },
  { size: "9 ½", diameter: 19.4 },
  { size: "10", diameter: 19.8 },
  { size: "10 ½", diameter: 20.2 },
  { size: "11", diameter: 20.6 },
  { size: "11 ½", diameter: 21.0 },
  { size: "12", diameter: 21.4 },
  { size: "12 ½", diameter: 21.8 },
  { size: "13", diameter: 22.2 },
  { size: "13 ½", diameter: 22.6 },
  { size: "14", diameter: 23.0 }
];

// ISO ID-1 Standard Card Width in millimeters (credit cards, driver's licenses, IDs)
const CARD_WIDTH_MM = 85.60;

// State Variables
let currentCardWidthPx = 300; // default width on screen
let pixelsPerMm = currentCardWidthPx / CARD_WIDTH_MM; // Pixels per millimeter based on calibration
let currentRingDiameterMm = 17.3; // Default to Size 7 (17.3mm)

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const cardSlider = document.getElementById('card-slider');
const cardOutline = document.getElementById('card-outline');
const cardWidthVal = document.getElementById('card-width-val');
const ringSlider = document.getElementById('ring-slider');
const ringCircle = document.getElementById('ring-circle');
const sizeOutputVal = document.getElementById('size-output-val');
const diameterOutputVal = document.getElementById('diameter-output-val');
const circumferenceOutputVal = document.getElementById('circumference-output-val');
const presetButtonsContainer = document.getElementById('preset-buttons');
const printBtn = document.getElementById('print-btn');

// Initialize Sizer
function init() {
  setupTabs();
  setupCalibration();
  setupRingSizer();
  generatePresets();
  updateRingUI();
}

// 1. Tab Navigation Logic
function setupTabs() {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
}

// 2. Calibration Logic (Card Outline)
function setupCalibration() {
  cardSlider.addEventListener('input', (e) => {
    currentCardWidthPx = parseInt(e.target.value);
    
    // Update card outline width and height proportionally (standard ratio is ~1.586)
    cardOutline.style.width = `${currentCardWidthPx}px`;
    cardOutline.style.height = `${currentCardWidthPx / 1.586}px`;
    
    // Update PPM
    pixelsPerMm = currentCardWidthPx / CARD_WIDTH_MM;
    
    // Update value text
    cardWidthVal.textContent = `${currentCardWidthPx}px`;
    
    // Update the ring circle scale based on new PPM
    updateRingUI();
  });
}

// 3. Ring Circle Adjustment Logic
function setupRingSizer() {
  ringSlider.addEventListener('input', (e) => {
    currentRingDiameterMm = parseFloat(e.target.value);
    updateRingUI();
    highlightActivePreset();
  });
}

// 4. Update UI Display for Ring Circle
function updateRingUI() {
  // Convert mm diameter to pixels
  const ringDiameterPx = currentRingDiameterMm * pixelsPerMm;
  
  // Set dimensions of the on-screen circle
  ringCircle.style.width = `${ringDiameterPx}px`;
  ringCircle.style.height = `${ringDiameterPx}px`;
  
  // Find the closest standard size
  const closest = findClosestRingSize(currentRingDiameterMm);
  
  // Update texts
  sizeOutputVal.textContent = closest.size;
  diameterOutputVal.textContent = `${currentRingDiameterMm.toFixed(1)} mm`;
  
  // Circumference calculation C = pi * d
  const circumference = currentRingDiameterMm * Math.PI;
  circumferenceOutputVal.textContent = `${circumference.toFixed(1)} mm`;
}

// Find closest size in standard list
function findClosestRingSize(diameterMm) {
  return ringSizes.reduce((prev, curr) => {
    return (Math.abs(curr.diameter - diameterMm) < Math.abs(prev.diameter - diameterMm) ? curr : prev);
  });
}

// 5. Preset Sizing Buttons
function generatePresets() {
  // Generate presets for common sizes (e.g. 5, 6, 7, 8, 9, 10, 11, 12)
  const commonSizes = ["5", "6", "7", "8", "9", "10", "11", "12"];
  
  commonSizes.forEach(sz => {
    const sizeData = ringSizes.find(item => item.size === sz);
    if (sizeData) {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.textContent = `Size ${sz}`;
      btn.addEventListener('click', () => {
        currentRingDiameterMm = sizeData.diameter;
        ringSlider.value = currentRingDiameterMm;
        updateRingUI();
        
        // Update active class
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      presetButtonsContainer.appendChild(btn);
    }
  });
}

function highlightActivePreset() {
  const btns = document.querySelectorAll('.preset-btn');
  btns.forEach(btn => {
    const sizeText = btn.textContent.replace('Size ', '');
    const sizeData = ringSizes.find(item => item.size === sizeText);
    if (sizeData && Math.abs(sizeData.diameter - currentRingDiameterMm) < 0.15) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// 6. Print Trigger Action
if (printBtn) {
  printBtn.addEventListener('click', () => {
    window.print();
  });
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', init);
