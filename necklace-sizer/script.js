// Necklace Sizer Interactive Script

// Predefined metric strings and Y positions for the overlay label inside the SVG
const labelData = {
  "14": { text: '14" / 35.6 cm', y: 88 },
  "16": { text: '16" / 40.6 cm', y: 102 },
  "18": { text: '18" / 45.7 cm', y: 116 },
  "20": { text: '20" / 50.8 cm', y: 131 },
  "22": { text: '22" / 55.9 cm', y: 146 },
  "24": { text: '24" / 61.0 cm', y: 161 },
  "30": { text: '30" / 76.2 cm', y: 186 },
  "33": { text: '33" / 83.8 cm', y: 202 },
  "36": { text: '36" / 91.4 cm', y: 205 } // Kept slightly higher to fit inside 220px viewport
};

// DOM Elements
const svg = document.querySelector('.silhouette-svg');
const necklaceLines = document.querySelectorAll('.necklace-line');
const tableRows = document.querySelectorAll('.table-row');
const labelGroup = document.getElementById('svg-labels');
const labelRect = document.getElementById('label-bg');
const labelText = document.getElementById('label-text');

// Initialize Sizer Event Listeners
function init() {
  setupSvgListeners();
  setupTableListeners();
}

// Activate Sizing Visuals
function activateSize(size) {
  // 1. Add active class to SVG path and parent
  svg.classList.add('has-active-necklace');
  const path = document.getElementById(`necklace-${size}`);
  if (path) path.classList.add('active');

  // 2. Add active class to table row
  tableRows.forEach(row => {
    if (row.getAttribute('data-size') === size) {
      row.classList.add('active');
      // Scroll into view if needed on small screens
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      row.classList.remove('active');
    }
  });

  // 3. Position and update SVG label
  const data = labelData[size];
  if (data && labelGroup && labelText && labelRect) {
    labelText.textContent = data.text;
    
    // Position text and its background card. Center of SVG is x=100.
    // Place label 2px above the lowest point of the curve.
    const labelY = data.y;
    
    // Position elements
    labelText.setAttribute('y', labelY + 9); // offset text baseline
    labelRect.setAttribute('y', labelY);
    labelRect.setAttribute('x', 70); // width 60 centered (100 - 30)
    labelRect.setAttribute('width', 60);
    
    // Reveal label
    labelGroup.style.opacity = '1';
    labelGroup.style.transition = 'opacity 0.2s ease';
  }
}

// Reset Sizing Visuals
function deactivateAll() {
  svg.classList.remove('has-active-necklace');
  necklaceLines.forEach(line => line.classList.remove('active'));
  tableRows.forEach(row => row.classList.remove('active'));
  if (labelGroup) {
    labelGroup.style.opacity = '0';
  }
}

// SVG Path Listeners
function setupSvgListeners() {
  necklaceLines.forEach(line => {
    const size = line.getAttribute('data-size');
    
    line.addEventListener('mouseenter', () => activateSize(size));
    line.addEventListener('mouseleave', deactivateAll);
    
    // Touch support for mobile
    line.addEventListener('touchstart', (e) => {
      e.preventDefault();
      activateSize(size);
    }, { passive: false });
  });
  
  // Close sizer on touching background area
  svg.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('silhouette-svg') || e.target.tagName === 'path' && !e.target.classList.contains('necklace-line')) {
      deactivateAll();
    }
  }, { passive: true });
}

// Table Row Listeners
function setupTableListeners() {
  tableRows.forEach(row => {
    const size = row.getAttribute('data-size');
    
    row.addEventListener('mouseenter', () => activateSize(size));
    row.addEventListener('mouseleave', deactivateAll);
    
    // Click/Touch to lock in size on mobile
    row.addEventListener('click', () => {
      if (row.classList.contains('active')) {
        deactivateAll();
      } else {
        activateSize(size);
      }
    });
  });
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', init);
