// Bangle & Bracelet Sizer Interactive Logic

// DOM Elements - Tab Switching
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// DOM Elements - Bracelet Sizer
const wristSlider = document.getElementById('wrist-slider');
const wristValIn = document.getElementById('wrist-val-in');
const wristValCm = document.getElementById('wrist-val-cm');
const fitSnugEl = document.getElementById('fit-snug');
const fitComfortEl = document.getElementById('fit-comfort');
const fitLooseEl = document.getElementById('fit-loose');
const braceletTableRows = document.querySelectorAll('#bracelet-table tbody tr');

// DOM Elements - Bangle Sizer
const bangleSlider = document.getElementById('bangle-slider');
const bangleValIn = document.getElementById('bangle-val-in');
const bangleValMm = document.getElementById('bangle-val-mm');
const bangleResSizeEl = document.getElementById('bangle-res-size');
const bangleResDiamEl = document.getElementById('bangle-res-diam');
const banglePreviewCircle = document.getElementById('bangle-preview-circle');
const circleLabel = document.getElementById('circle-label');
const bangleTableRows = document.querySelectorAll('#bangle-table tbody tr');

// 1. Tab Switching Functionality
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all buttons and contents
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Activate clicked tab
    btn.classList.add('active');
    const targetTab = document.getElementById(`tab-${btn.getAttribute('data-tab')}`);
    if (targetTab) targetTab.classList.add('active');
  });
});

// 2. Bracelet Slider Calculator Logic
function updateBraceletCalculator() {
  const wristIn = parseFloat(wristSlider.value);
  const wristCm = (wristIn * 2.54).toFixed(1);
  
  // Update Labels
  wristValIn.textContent = `${wristIn.toFixed(1)}"`;
  wristValCm.textContent = `/ ${wristCm} cm`;
  
  // Calculate recommended fits
  const snug = wristIn + 0.25;
  const comfort = wristIn + 0.5;
  const loose = wristIn + 0.75;
  
  fitSnugEl.innerHTML = `${snug.toFixed(2)}" <span class="metric">/ ${(snug * 2.54).toFixed(1)} cm</span>`;
  fitComfortEl.innerHTML = `${comfort.toFixed(2)}" <span class="metric">/ ${(comfort * 2.54).toFixed(1)} cm</span>`;
  fitLooseEl.innerHTML = `${loose.toFixed(2)}" <span class="metric">/ ${(loose * 2.54).toFixed(1)} cm</span>`;
  
  // Highlight matching row in the reference table
  braceletTableRows.forEach(row => {
    const min = parseFloat(row.getAttribute('data-range-min'));
    const max = parseFloat(row.getAttribute('data-range-max'));
    
    if (wristIn >= min && wristIn <= max) {
      row.classList.add('highlighted-row');
    } else {
      row.classList.remove('highlighted-row');
    }
  });
}

// 3. Bangle Slider Calculator Logic
function updateBangleCalculator() {
  const circIn = parseFloat(bangleSlider.value);
  const circMm = Math.round(circIn * 25.4);
  
  // Update Labels
  bangleValIn.textContent = `${circIn.toFixed(1)}"`;
  bangleValMm.textContent = `/ ${circMm} mm`;
  
  // Bangle size mappings based on Knuckle Circumference limit
  let sizeLabel = '';
  let diameterLabel = '';
  let circlePxSize = 120; // default display width/height in px
  
  if (circIn < 7.0) {
    sizeLabel = 'Size 2-2 <span class="metric">/ Small</span>';
    diameterLabel = '2.12" <span class="metric">/ 54 mm</span>';
    circlePxSize = 135;
  } else if (circIn >= 7.0 && circIn < 7.4) {
    sizeLabel = 'Size 2-4 <span class="metric">/ S-M</span>';
    diameterLabel = '2.25" <span class="metric">/ 57 mm</span>';
    circlePxSize = 150;
  } else if (circIn >= 7.4 && circIn < 7.8) {
    sizeLabel = 'Size 2-6 <span class="metric">/ Medium</span>';
    diameterLabel = '2.375" <span class="metric">/ 60 mm</span>';
    circlePxSize = 165;
  } else if (circIn >= 7.8 && circIn < 8.2) {
    sizeLabel = 'Size 2-8 <span class="metric">/ M-L</span>';
    diameterLabel = '2.50" <span class="metric">/ 64 mm</span>';
    circlePxSize = 180;
  } else if (circIn >= 8.2 && circIn < 8.6) {
    sizeLabel = 'Size 2-10 <span class="metric">/ Large</span>';
    diameterLabel = '2.625" <span class="metric">/ 67 mm</span>';
    circlePxSize = 195;
  } else {
    sizeLabel = 'Size 2-12 <span class="metric">/ X-Large</span>';
    diameterLabel = '2.75" <span class="metric">/ 70 mm</span>';
    circlePxSize = 210;
  }
  
  // Update Results
  bangleResSizeEl.innerHTML = sizeLabel;
  bangleResDiamEl.innerHTML = diameterLabel;
  
  // Update Visual Circle Preview
  const mmVal = diameterLabel.split('mm')[0].split('/').pop().trim();
  circleLabel.textContent = `${mmVal} mm`;
  banglePreviewCircle.style.width = `${circlePxSize}px`;
  banglePreviewCircle.style.height = `${circlePxSize}px`;
  
  // Highlight matching row in Bangle Reference Table
  bangleTableRows.forEach(row => {
    const min = parseFloat(row.getAttribute('data-circ-min'));
    const max = parseFloat(row.getAttribute('data-circ-max'));
    
    if (circIn >= min && circIn <= max) {
      row.classList.add('highlighted-row');
    } else {
      row.classList.remove('highlighted-row');
    }
  });
}

// 4. Initialize Slider Event Listeners
wristSlider.addEventListener('input', updateBraceletCalculator);
bangleSlider.addEventListener('input', updateBangleCalculator);

// Initial Calculations on Load
document.addEventListener('DOMContentLoaded', () => {
  updateBraceletCalculator();
  updateBangleCalculator();
});
