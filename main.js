// main.js for AdParcel Final

// --- Logo preload for brand advertisements ---
const logoImages = {};
const logoSources = {
  TESLA: 'assets/tesla.png',
  SPOTIFY: 'assets/spotify.png',
  NETFLIX: 'assets/netflix.png',
  AIRBNB: 'assets/airbnb.png',
  UBER: 'assets/uber.png',
  ZOOM: 'assets/zoom.png',
  SLACK: 'assets/slack.png',
  SHOPIFY: 'assets/shopify.png',
  STRIPE: 'assets/stripe.png',
  CANVA: 'assets/canva.png',
  FIGMA: 'assets/figma.png',
  NOTION: 'assets/notion.png',
  DISCORD: 'assets/discord.png',
  GITHUB: 'assets/github.png',
  LINEAR: 'assets/linear.png',
  VERCEL: 'assets/vercel.png',
  SUPABASE: 'assets/supabase.png',
  PLANETSCALE: 'assets/planetscale.png',
  RAILWAY: 'assets/railway.png'
};

const canvas      = document.getElementById('gridCanvas');
const ctx         = canvas.getContext('2d');
const gridSize    = 1000;
let cellSize    = 13; // Eski haline döndürdük
const soldParcels = new Set();

// Zoom variables
let zoomLevel = 1;
const minZoom = 0.1;
const maxZoom = 5.0;

// Ensure canvas dimensions stay within mobile Safari limits
// Many mobile browsers (especially iOS Safari) fail to render canvases with very large backing dimensions.
// We cap the backing store to a safe maximum and reduce cellSize proportionally if needed.
(() => {
  const MAX_CANVAS_DIMENSION = 4096; // conservative safe cap for iOS Safari
  const desiredDimension = gridSize * cellSize; // 1000 * 13 = 13000px
  if (desiredDimension > MAX_CANVAS_DIMENSION) {
    const adjusted = Math.max(1, Math.floor(MAX_CANVAS_DIMENSION / gridSize));
    cellSize = adjusted;
  }
  canvas.width  = gridSize * cellSize;
  canvas.height = gridSize * cellSize;
})();

// --- Fast zone pattern rendering ---
const zonePatternCache = {};
function createZonePattern(primaryHex, secondaryHex) {
  const tile = document.createElement('canvas');
  // Small tile with 2x2 cells checkerboard
  tile.width = cellSize * 2;
  tile.height = cellSize * 2;
  const tctx = tile.getContext('2d');
  // background
  tctx.fillStyle = primaryHex + 'cc';
  tctx.fillRect(0, 0, tile.width, tile.height);
  // alternate squares
  tctx.fillStyle = secondaryHex + 'cc';
  tctx.fillRect(0, 0, cellSize, cellSize);
  tctx.fillRect(cellSize, cellSize, cellSize, cellSize);
  return tctx.createPattern(tile, 'repeat');
}

function getZonePattern(zone) {
  if (zonePatternCache[zone]) return zonePatternCache[zone];
  const colors = {
    green: ['#22c55e', '#16a34a'],
    pink: ['#ec4899', '#db2777'],
    yellow: ['#fde047', '#facc15'],
    orange: ['#fb923c', '#f97316']
  };
  const [c1, c2] = colors[zone];
  const pat = createZonePattern(c1, c2);
  zonePatternCache[zone] = pat;
  return pat;
}

// --- Advertisement data setup ---
// Mark Nike advertisement parcels as "sold" area (375×125 block)
for (let y = 625; y <= 749; y++) {
  for (let x = 625; x <= 999; x++) {
    soldParcels.add(y * gridSize + x);
  }
}

// Zone colors lookup
const zoneColors = {
  green:  '#22c55e',
  pink:   '#ec4899',
  yellow: '#fde047',
  orange: '#fb923c'
};

// --- Bütçe Limiti ve Paket Seçimi ---
let budgetLimit = null;
const HIGH_PRICE_WARNING = 50; // $50+ için uyarı

function setBudgetLimit() {
  const input = document.getElementById('budgetLimit');
  const value = parseFloat(input.value);
  if (value && value > 0) {
    budgetLimit = value;
    alert(`Budget limit set to $${value.toFixed(2)}`);
    // Mevcut seçimi kontrol et
    if (selectedRect) {
      checkBudgetLimit();
    }
  } else {
    budgetLimit = null;
    alert('Budget limit cleared');
  }
}

function checkBudgetLimit() {
  if (!budgetLimit || !selectedRect) return true;
  
  const { x1, y1, x2, y2, zone } = selectedRect;
  const width = x2 - x1 + 1;
  const height = y2 - y1 + 1;
  const count = width * height;
  let totalPrice = 0;

  if (zone === 'green') {
    for (let row = y1; row <= y2; row++) {
      const pricePer = 0.35 + 0.05 * Math.floor((999 - row) / 2);
      totalPrice += pricePer * width;
    }
  } else if (zone === 'pink') {
    totalPrice = count * 15;
  } else {
    totalPrice = count * 0.05;
  }

  if (totalPrice > budgetLimit) {
    alert(`⚠️ Selection exceeds budget limit!\nSelected: $${totalPrice.toFixed(2)}\nBudget: $${budgetLimit.toFixed(2)}\n\nPlease select a smaller area.`);
    clearSelection();
    return false;
  }
  return true;
}

// --- New Purchase Functions ---
function purchaseParcels() {
  const parcelCount = parseInt(document.getElementById('parcelCount').value);
  
  if (!parcelCount || parcelCount < 1 || parcelCount > 1000) {
    alert('Please enter a valid parcel count between 1-1000!');
    return;
  }
  
  const totalPrice = parcelCount * 1.00; // $1.00 per parcel
  
  // Budget limit check
  if (budgetLimit && totalPrice > budgetLimit) {
    alert(`⚠️ Selection exceeds budget limit!\nSelected: $${totalPrice.toFixed(2)}\nBudget: $${budgetLimit.toFixed(2)}`);
    return;
  }
  
  // Find a random rectangular area in green zone
  const availableAreas = [];
  
  // Search for available rectangular areas in green zone
  for (let y = 500; y < 1000; y++) {
    for (let x = 0; x < 1000; x++) {
      // Try different rectangle sizes that can fit the parcel count
      const possibleSizes = [
        { w: parcelCount, h: 1 }, // 1 row
        { w: Math.ceil(parcelCount / 2), h: 2 }, // 2 rows
        { w: Math.ceil(parcelCount / 5), h: 5 }, // 5 rows
        { w: Math.ceil(parcelCount / 10), h: 10 }, // 10 rows
        { w: Math.ceil(Math.sqrt(parcelCount)), h: Math.ceil(Math.sqrt(parcelCount)) } // Square-ish
      ];
      
      for (const size of possibleSizes) {
        if (size.w * size.h === parcelCount && 
            x + size.w <= 1000 && y + size.h <= 1000) {
          
          // Check if this area is completely available
      let valid = true;
          const selectedParcels = [];
          
          for (let dy = 0; dy < size.h; dy++) {
            for (let dx = 0; dx < size.w; dx++) {
              const idx = (y + dy) * gridSize + (x + dx);
              if (soldParcels.has(idx) || getZone(x + dx, y + dy) !== 'green') {
          valid = false;
          break;
        }
              selectedParcels.push({ x: x + dx, y: y + dy, idx });
            }
            if (!valid) break;
      }
      
      if (valid) {
            availableAreas.push({
              x1: x, y1: y, x2: x + size.w - 1, y2: y + size.h - 1,
              parcels: selectedParcels
            });
          }
        }
      }
    }
  }
  
  if (availableAreas.length > 0) {
    // Select a random area
    const randomIndex = Math.floor(Math.random() * availableAreas.length);
    const bestArea = availableAreas[randomIndex];
    
    selectedRect = { ...bestArea, zone: 'green' };
    
    // Reset Lucky button when new selection is made
    spinCount = 0; // Reset spin count
    const luckButton = document.querySelector('button[onclick="tryLuck()"]');
    if (luckButton) {
      luckButton.dataset.won = 'false';
      luckButton.disabled = false;
      luckButton.textContent = '🎰 I FEEL LUCKY! 🎰';
      luckButton.className = 'w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black py-2 rounded font-bold hover:from-yellow-300 hover:to-orange-400 animate-bounce animate-pulse';
    }
    
    drawGrid();
    drawSelectionBox(selectedRect);
    updateSelectedSummary();
    
    // Scroll to selected area
    canvas.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    
    alert(`✅ ${parcelCount} parcels selected in a ${bestArea.x2 - bestArea.x1 + 1}×${bestArea.y2 - bestArea.y1 + 1} block! Total: $${totalPrice.toFixed(2)}`);
  } else {
    alert(`❌ No available ${parcelCount}-parcel block found in green zone`);
  }
}

// --- Spin counter ---
let spinCount = 0;

function tryLuck() {
  const luckButton = document.querySelector('button[onclick="tryLuck()"]');
  const resultDiv = document.getElementById('luckResult');
  
  // Check if user has already won (one-time only)
  if (luckButton.dataset.won === 'true') {
    alert('🎉 You already won! Lucky button can only be used once per session.');
          return;
        }
        
  // Check if user has selected parcels first
  if (!selectedRect || selectedRect.zone !== 'green') {
    alert('⚠️ Please select parcels in green zone first before trying your luck!');
    return;
  }
  
  // Check budget limit for $1.00
  if (budgetLimit && budgetLimit < 1.00) {
    alert(`⚠️ You need at least $1.00 budget to try your luck!\nCurrent budget: $${budgetLimit.toFixed(2)}`);
    return;
  }
  
  // Add $1.00 to budget limit (every spin, regardless of win/lose)
  if (budgetLimit) {
    budgetLimit += 1.00;
    
    // Update UI to show new budget
    const budgetInput = document.getElementById('budgetLimit');
    if (budgetInput) {
      budgetInput.value = budgetLimit.toFixed(2);
    }
    
    // Also update the summary to show new budget
    if (selectedRect) {
      updateSelectedSummary();
    }
    
    alert(`💰 $1.00 added to your budget! New budget: $${budgetLimit.toFixed(2)}`);
  }
  
  // Increment spin count
  spinCount++;
  
  // Update summary to show spin count
  if (selectedRect) {
    updateSelectedSummary();
  }
  
  // Disable button during animation
  luckButton.disabled = true;
  luckButton.textContent = '🎰 Spinning...';
  
  // Animation effect
  setTimeout(() => {
    const isLucky = Math.random() < 0.2; // 20% chance
    
    if (isLucky) {
      // WIN!
      resultDiv.innerHTML = `
        <div class="text-green-400 font-bold animate-bounce">
          🎉 CONGRATULATIONS! 🎉<br>
          YOU WON 10 PARCELS!<br>
          <span class="text-yellow-300">Worth $10.00!</span>
        </div>
      `;
      resultDiv.classList.remove('hidden');
      
      // Add confetti effect
      createConfetti();
      
      // Add 10 lucky parcels to existing selection
      addLuckyParcelsToSelection(10);
      
      // Mark as won (one-time only)
      luckButton.dataset.won = 'true';
      luckButton.textContent = '🎉 Already Won!';
      luckButton.disabled = true;
      luckButton.className = 'w-full bg-gray-500 text-gray-300 py-2 rounded font-bold cursor-not-allowed opacity-50';
      
    } else {
      // LOSE
      resultDiv.innerHTML = `
        <div class="text-red-400 font-bold">
          😔 Better luck next time!<br>
          <span class="text-gray-400">Try again!</span>
        </div>
      `;
      resultDiv.classList.remove('hidden');
      
      // Re-enable button for another try
      luckButton.disabled = false;
      luckButton.textContent = '🎰 I Feel Lucky!';
    }
    
    // Hide result after 5 seconds
    setTimeout(() => {
      resultDiv.classList.add('hidden');
    }, 5000);
    
  }, 2000); // 2 second animation
}

function addLuckyParcelsToSelection(count) {
  // Find 10 parcels near the existing selection
  const existingParcels = selectedRect.parcels || [];
  const existingIndices = new Set(existingParcels.map(p => p.idx));
  
  // Find available parcels near the existing selection
  const availableParcels = [];
  const searchRadius = 50; // Search within 50 cells radius
  
  for (let y = Math.max(0, selectedRect.y1 - searchRadius); y <= Math.min(999, selectedRect.y2 + searchRadius); y++) {
    for (let x = Math.max(0, selectedRect.x1 - searchRadius); x <= Math.min(999, selectedRect.x2 + searchRadius); x++) {
      const idx = y * gridSize + x;
      if (!soldParcels.has(idx) && !existingIndices.has(idx) && getZone(x, y) === 'green') {
        availableParcels.push({ x, y, idx });
      }
    }
  }
  
  if (availableParcels.length >= count) {
    // Try to find a contiguous block first
    let contiguousBlock = null;
    
    // Search for contiguous blocks right next to existing selection
    for (let y = Math.max(0, selectedRect.y1 - 5); y <= Math.min(999, selectedRect.y2 + 5); y++) {
      for (let x = Math.max(0, selectedRect.x1 - 5); x <= Math.min(999, selectedRect.x2 + 5); x++) {
        // Try different rectangle sizes that can fit the count
        const possibleSizes = [
          { w: count, h: 1 }, // 1 row
          { w: Math.ceil(count / 2), h: 2 }, // 2 rows
          { w: Math.ceil(count / 5), h: 5 }, // 5 rows
          { w: Math.ceil(count / 10), h: 10 }, // 10 rows
          { w: Math.ceil(Math.sqrt(count)), h: Math.ceil(Math.sqrt(count)) } // Square-ish
        ];
        
        for (const size of possibleSizes) {
          if (size.w * size.h === count && 
              x + size.w <= 1000 && y + size.h <= 1000) {
            
            // Check if this area is completely available
            let valid = true;
            const selectedParcels = [];
            
            for (let dy = 0; dy < size.h; dy++) {
              for (let dx = 0; dx < size.w; dx++) {
                const idx = (y + dy) * gridSize + (x + dx);
                if (soldParcels.has(idx) || existingIndices.has(idx) || getZone(x + dx, y + dy) !== 'green') {
                  valid = false;
                  break;
                }
                selectedParcels.push({ x: x + dx, y: y + dy, idx, isLucky: true });
              }
              if (!valid) break;
            }
            
            if (valid) {
              contiguousBlock = {
                x1: x, y1: y, x2: x + size.w - 1, y2: y + size.h - 1,
                parcels: selectedParcels
              };
              break;
            }
          }
        }
        if (contiguousBlock) break;
      }
      if (contiguousBlock) break;
    }
    
    if (contiguousBlock) {
      // Add contiguous block to existing selection
      selectedRect.parcels = [...existingParcels, ...contiguousBlock.parcels];
      
      // Update bounding box to include new parcels
      const allParcels = selectedRect.parcels;
      const minX = Math.min(...allParcels.map(p => p.x));
      const maxX = Math.max(...allParcels.map(p => p.x));
      const minY = Math.min(...allParcels.map(p => p.y));
      const maxY = Math.max(...allParcels.map(p => p.y));
      
      selectedRect.x1 = minX;
      selectedRect.y1 = minY;
      selectedRect.x2 = maxX;
      selectedRect.y2 = maxY;
      
      // Redraw and update
        drawGrid();
        drawSelectionBox(selectedRect);
        updateSelectedSummary();
        
      // Scroll to show the updated selection
      canvas.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      
      alert(`🎉 ${count} lucky parcels added in a ${contiguousBlock.x2 - contiguousBlock.x1 + 1}×${contiguousBlock.y2 - contiguousBlock.y1 + 1} block! Total parcels: ${selectedRect.parcels.length}`);
    } else {
      // Fallback: Add random parcels if no contiguous block found
      const selectedLuckyParcels = [];
      const shuffled = [...availableParcels].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < count; i++) {
        selectedLuckyParcels.push({ ...shuffled[i], isLucky: true });
      }
      
      // Add to existing selection
      selectedRect.parcels = [...existingParcels, ...selectedLuckyParcels];
      
      // Update bounding box to include new parcels
      const allParcels = selectedRect.parcels;
      const minX = Math.min(...allParcels.map(p => p.x));
      const maxX = Math.max(...allParcels.map(p => p.x));
      const minY = Math.min(...allParcels.map(p => p.y));
      const maxY = Math.max(...allParcels.map(p => p.y));
      
      selectedRect.x1 = minX;
      selectedRect.y1 = minY;
      selectedRect.x2 = maxX;
      selectedRect.y2 = maxY;
      
      // Redraw and update
      drawGrid();
      drawSelectionBox(selectedRect);
      updateSelectedSummary();
      
      // Scroll to show the updated selection
      canvas.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      
      alert(`🎉 ${count} lucky parcels added to your selection! Total parcels: ${selectedRect.parcels.length}`);
    }
  } else {
    alert(`❌ Not enough available parcels near your selection to add ${count} lucky parcels.`);
  }
}

function createConfetti() {
  // Simple confetti effect
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.innerHTML = ['🎉', '✨', '🌟', '💫', '🎊'][Math.floor(Math.random() * 5)];
      confetti.style.position = 'fixed';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.top = '-10px';
      confetti.style.fontSize = '20px';
      confetti.style.pointerEvents = 'none';
      confetti.style.zIndex = '9999';
      confetti.style.animation = 'fall 3s linear forwards';
      
      document.body.appendChild(confetti);
      
      setTimeout(() => {
        confetti.remove();
      }, 3000);
    }, i * 50);
  }
}

// Add CSS for confetti animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fall {
    to {
      transform: translateY(100vh) rotate(360deg);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);


// Update total price when input changes
document.addEventListener('DOMContentLoaded', function() {
  const parcelInput = document.getElementById('parcelCount');
  const totalPriceSpan = document.getElementById('totalPrice');
  
  if (parcelInput && totalPriceSpan) {
    parcelInput.addEventListener('input', function() {
      const count = parseInt(this.value) || 0;
      const total = count * 1.00;
      totalPriceSpan.textContent = total.toFixed(2);
    });
  }
});

// --- Idle scheduler & first-interaction bootstrap ---
const scheduleIdle = (cb, timeout = 300) => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(cb, { timeout });
  } else {
    setTimeout(cb, Math.min(timeout, 200));
  }
};
let bootstrapped = false;
function bootstrapNonCritical() {
  if (bootstrapped) return;
  bootstrapped = true;
  // Kick off chat and logo preloads without blocking first paint
  scheduleIdle(() => {
    try { startChatParcelSimulation(); } catch(e) {}
  }, 500);
  scheduleIdle(() => {
    try { preloadLogos(); } catch(e) {}
  }, 800);
  // Force-load hidden ad images on Safari (lazy may not start for display:none)
  scheduleIdle(() => {
    try { preloadAdImages(); } catch(e) {}
  }, 600);
  // Gentle redraws after idle to incorporate any loaded assets
  scheduleIdle(() => { try { drawGrid(); } catch(e) {} }, 1200);
  scheduleIdle(() => { try { drawGrid(); } catch(e) {} }, 2000);
}
['touchstart','pointerdown','scroll','keydown','click'].forEach(evt => {
  window.addEventListener(evt, bootstrapNonCritical, { once: true, passive: true });
});
// Also attempt idle bootstrap after DOM is ready
document.addEventListener('DOMContentLoaded', () => scheduleIdle(bootstrapNonCritical, 1000));

function preloadAdImages() {
  const ids = ['nikeAd','temaAd','ad1','ad2','ad3','ad4','ad5','ad6','ad7'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el || (el.complete && el.naturalWidth > 0)) return;
    const src = el.getAttribute('src');
    if (!src) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { try { drawGrid(); } catch(e) {} };
    img.src = src;
  });
}
// --- Single Pixel Selection ---
function selectSinglePixel() {
  alert('🎉 LIMITED OFFER: Only 1000-parcel packages (100×10) are available in green zone for $5.00! This is a special launch offer. Thank you for your understanding.');
}

// --- Modal control functions ---
function openParcelDetails(imageSrc, metaHtml) {
  document.getElementById('parcelImage').src = imageSrc;
  document.getElementById('parcelMeta').innerHTML = metaHtml;
  document.getElementById('parcelDetailsModal').classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeParcelModal() {
  document.getElementById('parcelDetailsModal').classList.add('hidden');
  document.body.classList.remove('modal-open');
}

// --- Early Bird Campaign Functions ---
function buyEarlyBird() {
  // Check if campaign is still active
  const earlyBirdSold = 15000;
  const earlyBirdMax = 15004; // 4 spots left
  
  if (earlyBirdSold >= earlyBirdMax) {
    alert("Early Bird campaign has ended! Thank you for your interest.");
    return;
  }
  
  // Hype effects before opening the modal
  triggerEarlyBirdHype();

  // Auto-select 500 parcels in green zone
  autoSelectGreenZone500();
  
  // Show Early Bird modal
  document.getElementById('earlyBirdModal').classList.remove('hidden');
  document.body.classList.add('modal-open');

  // Animate modal entrance (scale + fade)
  const modalCard = document.querySelector('#earlyBirdModal > div');
  if (modalCard) {
    modalCard.style.transform = 'scale(0.92)';
    modalCard.style.opacity = '0';
    modalCard.style.transition = 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease-out';
    requestAnimationFrame(() => {
      modalCard.style.transform = 'scale(1)';
      modalCard.style.opacity = '1';
    });
  }

  // Emphasize BUY NOW button with heartbeat for a short period
  const cta = document.querySelector('#earlyBirdModal button[onclick="proceedToPurchase()"]');
  if (cta) {
    ensureHypeStyles();
    cta.classList.add('heartbeat-cta');
  }
}

function closeEarlyBirdModal() {
  document.getElementById('earlyBirdModal').classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function proceedToPurchase() {
  const purchaseLink = "https://testingin1day.ikas.shop/adparcel-1-permanent-parcel-green-zonetamma";
  
  // Close early bird modal first
  closeEarlyBirdModal();
  
  // Open purchase link in pop-up modal/iframe
  let modal = document.getElementById('purchaseLinkModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'purchaseLinkModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center hidden z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] relative">
        <button onclick="closePurchaseLinkModal()" class="absolute top-2 right-3 text-xl font-bold text-red-600 hover:text-red-800">×</button>
        <iframe src="${purchaseLink}" class="w-full h-[85vh] border-0 rounded"></iframe>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Add close function globally
    window.closePurchaseLinkModal = function() {
      document.getElementById('purchaseLinkModal').classList.add('hidden');
    };
  }
  
  modal.classList.remove('hidden');
}

function autoSelectGreenZone500() {
  // Clear existing selection
  if (typeof selectedParcels === 'undefined') return;
  selectedParcels.clear();
  if (typeof selectedSummary !== 'undefined') {
    selectedSummary = '';
  }
  
  // Find available parcels in green zone (y >= 500)
  const greenZoneParcels = [];
  for (let y = 500; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const parcelId = y * gridSize + x;
      if (!soldParcels.has(parcelId)) {
        greenZoneParcels.push({x, y, id: parcelId});
      }
    }
  }
  
  // Select first 500 available parcels
  const parcelsToSelect = greenZoneParcels.slice(0, 500);
  
  parcelsToSelect.forEach(parcel => {
    selectedParcels.add(parcel.id);
  });
  
  // Update summary
  selectedSummary = `Early Bird Package: 500 parcels selected in Green Zone`;
  
  // Update UI
  if (typeof updateSelectedBox === 'function') {
    updateSelectedBox();
  }
  
  // Update purchase modal info
  const selectedInfo = document.getElementById('selectedInfo');
  if (selectedInfo) {
    selectedInfo.textContent = `Early Bird Package: 500 parcels in Green Zone - $5.00 (99% OFF!)`;
  }
  
  // Update parcel coordinates for form
  const parcelCoords = document.getElementById('parcelCoords');
  if (parcelCoords) {
    const coords = parcelsToSelect.map(p => `${p.x},${p.y}`).join(';');
    parcelCoords.value = coords;
  }
  
  // Redraw grid to show selection
  if (typeof drawGrid === 'function') {
    drawGrid();
  }
}

// --- Chat-Parcel Simulation ---
function startChatParcelSimulation() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  // Clear any existing messages
  chatMessages.innerHTML = '';
  
  const chatPool = [
    'Alex Martinez', 'Sarah Chen', 'Mike Johnson', 'Emma Wilson', 'David Lee',
    'Lisa Garcia', 'Tom Anderson', 'Anna Smith', 'Chris Brown', 'Maria Rodriguez',
    'James Taylor', 'Jennifer Davis', 'Robert Miller', 'Michelle White', 'Kevin Thomas'
  ];
  
  const chatTexts = [
    "Just bought 50 parcels! 🎉",
    "This grid is addictive!",
    "Who's bidding in pink zone?",
    "Early bird deal is insane!",
    "My ad went live yesterday!",
    "Anyone else from Turkey? 🇹🇷",
    "Green zone prices are crazy low",
    "Just won an auction! 💰",
    "This is better than social media",
    "Who designed this? Genius!",
    "My ROI is already 300%",
    "Anyone want to collaborate?",
    "Parcel neighbors, say hi! 👋",
    "This is the future of ads",
    "Just planted 5 trees 🌳",
    "Who's the mystery bidder?",
    "Orange zone rental is smart",
    "News ticker is hilarious",
    "Premium features when?",
    "Best investment ever made",
    // Added legacy-style lines into the modern pool
    "Wish list: 20 more parcels 😅",
    "Second time bidder here 🙂",
    "Just secured my ad spot!",
    // Extra variety for realism
    "Anyone tried orange zone rental yet?",
    "Green zone flipping is underrated tbh",
    "Bidding psychology is wild tonight",
    "Who else mapping brand name with parcels?",
    "Loving the heartbeat CTA ngl",
    "Got my logo centered perfectly 🙌",
    "Design team did my banner for free?!",
    "+30% views in 3 days confirmed",
    "Leaderboard when? 👀",
    "Shipping my first ad campaign now",
    "Is Premium worth it for DM collabs?",
    "I need a 10x10 in yellow asap",
    "Pink zone is popping off rn",
    "Respect to whoever owns row 500",
    "Mobile perf feels smooth today",
    "Confetti got me to click 😂",
    "Grid game will be insane if done right",
    "Who's building tools around this?",
    "FOMO is real, just grabbed another 25",
    "I framed my parcel around a logo edge",
    "Anyone offering parcel resale service?",
    "Weekend bids > weekday bids, every time",
    "Snipe misses hurt 😅",
    "Yellow CPM looks unbeatable",
    "Brand fit matters more than count imo",
    "Creative boost after midnight ✍️",
    "This chat feels alive now 🔥"
  ];
  
  let lastChatIdx = -1;
  
  function addChatMessage() {
    const randomPerson = chatPool[Math.floor(Math.random() * chatPool.length)];
    const randomText = chatTexts[Math.floor(Math.random() * chatTexts.length)];
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start gap-2 py-2 border-b border-gray-700 last:border-b-0';
    
    // Avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'w-7 h-7 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0';
    avatarDiv.textContent = randomPerson.charAt(0);
    
    // Message content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex-1 min-w-0';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'text-xs font-semibold text-green-400 mb-1';
    nameDiv.textContent = randomPerson;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'text-xs text-gray-300 break-words';
    textDiv.textContent = randomText;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'text-xs text-gray-500 mt-1';
    timeDiv.textContent = new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
    
    contentDiv.appendChild(nameDiv);
    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timeDiv);
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(messageDiv);
    
    // Keep only last 12 messages
    while (chatMessages.children.length > 12) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
    
    // Auto scroll to bottom
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 50);
  }
  
  // Add initial burst (faster, more messages)
  const initialBurst = 8;
  for (let i = 0; i < initialBurst; i++) {
    setTimeout(() => addChatMessage(), i * 140);
  }
  
  // Add new messages faster (1.5–3.5s) with jitter
  function scheduleNextChat() {
    const delay = 1500 + Math.random() * 2000;
    window.chatParcelInterval = setTimeout(() => {
      addChatMessage();
      scheduleNextChat();
    }, delay);
  }
  scheduleNextChat();
}

function stopChatParcelSimulation() {
  if (window.chatParcelInterval) {
    clearInterval(window.chatParcelInterval);
  }
}

// Start chat simulation when page loads
// Deferred to idle/first interaction via bootstrapNonCritical

// Expose Early Bird functions globally for inline onclick handlers
window.buyEarlyBird = buyEarlyBird;
window.closeEarlyBirdModal = closeEarlyBirdModal;
window.proceedToPurchase = proceedToPurchase;

// --- Early Bird Hype (confetti, flash, fast ticker) ---
function triggerEarlyBirdHype() {
  // Vibrate device (if supported)
  if (navigator.vibrate) {
    navigator.vibrate(150);
  }

  // Temporarily speed up the news ticker
  const ticker = document.getElementById('tickerContent');
  if (ticker) {
    ensureHypeStyles();
    ticker.classList.add('fastTicker');
    setTimeout(() => ticker.classList.remove('fastTicker'), 6000);
  }

  // Screen flash overlay
  const flash = document.createElement('div');
  flash.style.position = 'fixed';
  flash.style.inset = '0';
  flash.style.zIndex = '60';
  flash.style.pointerEvents = 'none';
  flash.style.background = 'rgba(255,255,255,0.65)';
  flash.style.transition = 'opacity 300ms ease-out';
  document.body.appendChild(flash);
  requestAnimationFrame(() => {
    flash.style.opacity = '0';
  });
  setTimeout(() => flash.remove(), 350);

  // Confetti/emoji bursts in waves
  spawnEmojiBurst(42);
  setTimeout(() => spawnEmojiBurst(42), 800);
  setTimeout(() => spawnEmojiBurst(42), 1600);
}

function ensureHypeStyles() {
  if (document.getElementById('earlyBirdHypeStyles')) return;
  const style = document.createElement('style');
  style.id = 'earlyBirdHypeStyles';
  style.textContent = `
    .fastTicker { animation-duration: 8s !important; }
    @keyframes eb-fall { to { transform: translateY(120vh) rotate(360deg); opacity: 0.8; } }
    @keyframes eb-heartbeat { 0% { transform: scale(1); } 10% { transform: scale(1.12); } 20% { transform: scale(0.98); } 30% { transform: scale(1.15); } 40% { transform: scale(1.02); } 100% { transform: scale(1); } }
    .heartbeat-cta { animation: eb-heartbeat 900ms ease-in-out infinite; }
    @keyframes eb-impact { 0% { transform: scale(0.9); filter: drop-shadow(0 0 0 rgba(255,255,255,0)); opacity: 0.6; } 40% { transform: scale(1.14); filter: drop-shadow(0 6px 12px rgba(255,255,0,0.5)); opacity: 1; } 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(0,0,0,0)); } }
    .auctioneer-impact { animation: eb-impact 520ms cubic-bezier(0.2, 0.8, 0.2, 1) 1; }
  `;
  document.head.appendChild(style);
}

function spawnEmojiBurst(count = 36) {
  const emojis = ['🎉','💸','🔥','🚀','✨','🎯'];
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span');
    span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    span.style.position = 'fixed';
    span.style.left = Math.random() * 100 + 'vw';
    span.style.top = '-5vh';
    span.style.fontSize = (Math.random() * 18 + 14) + 'px';
    span.style.zIndex = '61';
    span.style.pointerEvents = 'none';
    span.style.transform = 'translateY(-20vh)';
    span.style.animation = `eb-fall ${1.2 + Math.random()*1.8}s ease-in forwards`;
    document.body.appendChild(span);
    setTimeout(() => span.remove(), 3200);
  }
}

// --- Bidding Modal Functions ---
function openBiddingModal() {
  document.getElementById('biddingModal').classList.remove('hidden');
  document.body.classList.add('modal-open');
  
  // Start bidding animation
  startBiddingAnimation();
}

function closeBiddingModal() {
  document.getElementById('biddingModal').classList.add('hidden');
  document.body.classList.remove('modal-open');
  
  // Stop all bidding animations
  if (window.biddingInterval) {
    clearInterval(window.biddingInterval);
  }
  if (window.timerInterval) {
    clearInterval(window.timerInterval);
  }
  if (window.hammerInterval) {
    clearInterval(window.hammerInterval);
  }
  if (window.chatInterval) {
    clearInterval(window.chatInterval);
  }
}

function startBiddingAnimation() {
  const counter = document.getElementById('biddingCounter');
  const nextBid = document.getElementById('nextBid');
  const currentBidder = document.getElementById('currentBidder');
  const auctioneerMessage = document.getElementById('auctioneerMessage');
  const auctioneerName = document.getElementById('auctioneerName');
  const auctionTimer = document.getElementById('auctionTimer');
  const totalBids = document.getElementById('totalBids');
  const participants = document.getElementById('participants');
  const liveUpdates = document.getElementById('liveUpdates');
  
  let currentBid = 127.50;
  let bidCount = 47;
  let participantCount = 23;
  let timeRemaining = 2 * 3600 + 34 * 60 + 12; // 2h 34m 12s in seconds
  
  const bidIncrement = 0.25;
  // Shared realistic name pool for bidders, chat and live updates
  const peoplePool = [
    'Alex Martinez', 'Sarah Chen', 'Mike Johnson', 'Emma Wilson', 'David Lee',
    'Lisa Garcia', 'Tom Anderson', 'Anna Smith', 'Chris Brown', 'Maria Rodriguez',
    'James Taylor', 'Jennifer Davis', 'Robert Miller', 'Michelle White', 'Kevin Thomas',
    'Amanda Harris', 'Daniel Martin', 'Jessica Thompson', 'Ryan Garcia', 'Nicole Martinez',
    'Jason Clark', 'Olivia Perez', 'Ethan Wright', 'Sophia Turner', 'Benjamin Scott',
    'Ava Green', 'Liam Walker', 'Emily Hall', 'Noah Adams', 'Isabella Reed',
    'Mason Brooks', 'Mia Collins', 'Elijah Torres', 'Harper Rivera', 'Logan Foster',
    'Chloe Simmons', 'Lucas Hayes', 'Grace Powell', 'Henry Ward', 'Nora Hughes'
  ];
  
  const auctioneers = [
    'Michael Carter', 'Laura Bennett', 'Anthony Brooks', 'Samantha Reed', 'Jonathan Hayes'
  ];
  
  const auctioneerPhrases = [
    "Going once... Going twice... SOLD!",
    "Do I hear $127.75? Going once...",
    "The bid is $127.50! Any advance?",
    "Ladies and gentlemen, we have a new bid!",
    "This is getting exciting! $127.75 anyone?",
    "Going once at $127.50... Going twice...",
    "We have a bidder! The excitement is building!",
    "Last chance at $127.50! Going once...",
    "Hold your cards—new offer coming in hot!",
    "Who's brave enough to top that?",
    "And we have momentum—keep those bids coming!",
    "Back in the lead—what a snipe!",
    "Don't blink—this one's moving fast!",
    "Sharp bid! Do we hear a counter?",
    "Crowd's heating up—next raise, please!",
    "We're not done yet—push it higher!"
  ];
  
  // Message templates (we'll inject names dynamically)
  const liveUpdateTemplates = [
    (name, amount) => `🔥 New bid from ${name}! $${amount}`,
    (name) => `⚡ ${name} is heating up!`,
    () => `🎯 3 bidders competing fiercely!`,
    (name) => `💎 ${name} just entered the race!`,
    (name) => `🏆 ${name} is not backing down!`,
    (name) => `⭐ ${name} making moves!`,
    (name) => `🚀 ${name} on fire!`,
    (name) => `💪 ${name} joining the battle!`,
    (name, amount) => `📈 ${name} inches ahead at $${amount}`,
    (name) => `🎉 Crowd goes wild for ${name}!`,
    () => `⏱️ Last-minute bids are flying in!`,
    (name) => `🔁 ${name} just reclaimed the top spot!`,
    (name) => `🧠 Smart move by ${name}—timing is perfect!`,
    (name) => `🧨 Pressure's on—${name} making waves!`,
    () => `🧲 More bidders are joining the arena...`
  ];
  
  const chatMessages = [
    "OMG this is getting intense! 🔥",
    "I can't believe the price is going this high!",
    "This is the most exciting auction ever!",
    "This auction is insane! 💰",
    "Who's going to win this? 🤔",
    "The tension is real! 😱",
    "This is better than Netflix! 📺",
    "I'm on the edge of my seat! 🪑",
    "This is auction history in the making! 📚",
    "The bids are flying! ✈️",
    "This is pure adrenaline! 💉",
    "My heart is racing—what a battle!",
    "Blink and you miss it—wild pace!",
    "We have a duel! Next bid when?",
    "Snipe incoming… I feel it 👀",
    "That raise was clean—respect",
    "We're in the endgame now…",
    "Someone's about to steal this 😬",
    "Popcorn time—don't stop! 🍿",
    "Price discovery at its finest"
  ];

  // Helpers to avoid immediate repeats
  function pickIndexDifferent(lastIndex, length) {
    if (length <= 1) return 0;
    let idx = Math.floor(Math.random() * length);
    if (idx === lastIndex) {
      idx = (idx + 1) % length;
    }
    return idx;
  }
  let lastAuctioneerIdx = -1;
  let lastLiveTemplateIdx = -1;
  let lastChatIdx = -1;
  let lastAuctioneerNameIdx = -1;

  // --- Active Bidders (6 rotating) ---
  let activeBidders = peoplePool.slice(0, 6);
  let tickCount = 0;

  function pickRandomPerson(excludeSet) {
    const pool = peoplePool.filter(n => !excludeSet.has(n));
    return pool[Math.floor(Math.random() * pool.length)] || peoplePool[0];
  }

  function getActiveBiddersContainer() {
    // Find the "ACTIVE BIDDERS" grid inside the bidding modal
    const modal = document.getElementById('biddingModal');
    // The section has title "🎯 ACTIVE BIDDERS" followed by a grid
    const sections = modal.querySelectorAll('.bg-black.bg-opacity-30.rounded-lg.p-3');
    for (const section of sections) {
      const title = section.querySelector('.text-sm.font-bold');
      if (title && title.textContent && title.textContent.includes('ACTIVE BIDDERS')) {
        return section.querySelector('.grid');
      }
    }
    return null;
  }

  function renderActiveBidders(currentBidValue) {
    const container = getActiveBiddersContainer();
    if (!container) return;

    // Compute near-current amounts for 6 bidders
    const deltas = [0.05, 0.10, 0.15, 0.20, 0.30, 0.50].map(d => d + Math.random() * 0.05);
    deltas.sort((a, b) => a - b); // smallest delta closest to currentBid
    const items = activeBidders.map((name, idx) => ({
      name,
      amount: Math.max(0.01, currentBidValue - deltas[idx])
    })).sort((a, b) => b.amount - a.amount);

    // Build 6 cards
    container.innerHTML = '';
    for (const it of items) {
      const card = document.createElement('div');
      card.className = 'bg-red-500 bg-opacity-30 rounded p-1 animate-pulse';
      const nameDiv = document.createElement('div');
      nameDiv.className = 'font-bold';
      nameDiv.textContent = it.name;
      const valueDiv = document.createElement('div');
      valueDiv.className = 'text-xs';
      valueDiv.textContent = `$${it.amount.toFixed(2)}`;
      card.appendChild(nameDiv);
      card.appendChild(valueDiv);
      container.appendChild(card);
    }
  }

  function rotateActiveBidders(avoidName) {
    // Every few ticks, replace 1 bidder with a new one not in the current list or avoidName
    const exclude = new Set(activeBidders);
    if (avoidName) exclude.add(avoidName);
    const replacement = pickRandomPerson(exclude);
    const replaceIndex = Math.floor(Math.random() * activeBidders.length);
    activeBidders[replaceIndex] = replacement;
  }
  
  // Main bidding animation
  window.biddingInterval = setInterval(() => {
    // Update bid
    currentBid += bidIncrement;
    counter.textContent = `$${currentBid.toFixed(2)}`;
    nextBid.textContent = `$${(currentBid + bidIncrement).toFixed(2)}`;
    
    // Random current bidder from people pool
    const randomBidder = peoplePool[Math.floor(Math.random() * peoplePool.length)];
    currentBidder.textContent = randomBidder;
    
    // Update counters
    bidCount += Math.floor(Math.random() * 3) + 1;
    totalBids.textContent = bidCount;
    
    if (Math.random() > 0.7) {
      participantCount += 1;
      participants.textContent = participantCount;
    }
    
    // Update auctioneer message
    lastAuctioneerIdx = pickIndexDifferent(lastAuctioneerIdx, auctioneerPhrases.length);
    const randomPhrase = auctioneerPhrases[lastAuctioneerIdx];
    auctioneerMessage.textContent = `"${randomPhrase}"`;
    // Impact animation on auctioneer message
    if (typeof ensureHypeStyles === 'function') ensureHypeStyles();
    auctioneerMessage.classList.remove('auctioneer-impact');
    void auctioneerMessage.offsetWidth;
    auctioneerMessage.classList.add('auctioneer-impact');
    
    // Update auctioneer name on every message (avoid immediate repeats)
    lastAuctioneerNameIdx = pickIndexDifferent(lastAuctioneerNameIdx, auctioneers.length);
    auctioneerName.textContent = auctioneers[lastAuctioneerNameIdx];
    
    // Update live updates with realistic names and near amounts
    lastLiveTemplateIdx = pickIndexDifferent(lastLiveTemplateIdx, liveUpdateTemplates.length);
    const tmpl = liveUpdateTemplates[lastLiveTemplateIdx];
    const nearAmount = (currentBid - Math.max(0.05, Math.min(0.5, Math.random() * 0.5)) ).toFixed(2);
    const updateElement = liveUpdates.querySelector('div');
    updateElement.textContent = tmpl(randomBidder, nearAmount);

    // Rotate active bidders every 3 ticks
    tickCount += 1;
    if (tickCount % 3 === 0) {
      rotateActiveBidders(randomBidder);
    }
    renderActiveBidders(currentBid);
    
    // Add vibration effect (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
  }, 1500); // Faster updates for more excitement
  
  // Timer countdown
  window.timerInterval = setInterval(() => {
    timeRemaining -= 1;
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    auctionTimer.textContent = `${hours}h ${minutes}m ${seconds}s`;
    
    if (timeRemaining <= 0) {
      timeRemaining = 2 * 3600 + 34 * 60 + 12; // Reset timer
    }
  }, 1000);
  
  // Add auctioneer hammer animation
  window.hammerInterval = setInterval(() => {
    const auctioneer = document.getElementById('auctioneer');
    auctioneer.style.transform = 'scale(1.2)';
    setTimeout(() => {
      auctioneer.style.transform = 'scale(1)';
    }, 200);
  }, 3000);
  
  // Add live chat system
  window.chatInterval = setInterval(() => {
    const liveChat = document.getElementById('liveChat');
    lastChatIdx = pickIndexDifferent(lastChatIdx, chatMessages.length);
    const randomMessage = chatMessages[lastChatIdx];
    const randomBidder = peoplePool[Math.floor(Math.random() * peoplePool.length)];
    
    // Create new chat message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'animate-pulse text-xs';
    messageDiv.innerHTML = `<span class="text-blue-300 font-bold">${randomBidder}:</span> <span class="text-white">${randomMessage}</span>`;
    
    // Add to chat
    liveChat.appendChild(messageDiv);
    
    // Keep only last 20 messages
    while (liveChat.children.length > 20) {
      liveChat.removeChild(liveChat.firstChild);
    }
    
    // Auto scroll to bottom
    liveChat.scrollTop = liveChat.scrollHeight;
    
  }, 800); // Very fast chat updates
}

// --- Zone determination ---
function getZone(x, y) {
  if (y >= 500) return 'green';
  if (x < 500)  return 'pink';
  if (x >= 750 && y < 250) return 'orange';
  if (x >= 500 && x < 750 && y < 500) return 'yellow';
  return 'yellow'; // Fallback
}

// --- Cell color selection ---
function getFillColor(x, y) {
  const zone = getZone(x, y);
  const isEven = (x + y) % 2 === 0;
  const colors = {
    green:  isEven ? '#22c55e' : '#16a34a',
    pink:   isEven ? '#ec4899' : '#db2777',
    yellow: isEven ? '#fde047' : '#facc15',
    orange: isEven ? '#fb923c' : '#f97316'
  };
  return colors[zone] + 'cc';  // add ~80% opacity
}

// --- Draw the Nike advertisement image on the canvas ---
function drawNikeAd() {
  const img = document.getElementById('nikeAd');
  if (!img.complete) {
    img.onload = drawNikeAd;
    return;
  }
  const startX = 625 * cellSize;
  const startY = 625 * cellSize;
  const width  = (999 - 625 + 1) * cellSize;
  const height = (749 - 625 + 1) * cellSize;
  ctx.drawImage(img, startX, startY, width, height);
}

// (auxiliary advertisement drawing removed for production)

// --- Hover Effect for Ads (disabled in production) ---
let hoveredAd = null;
let tooltip = null;

function handleAdHover(event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) * (canvas.width / rect.width) / cellSize);
  const y = Math.floor((event.clientY - rect.top) * (canvas.height / rect.height) / cellSize);
  
  const brandAds = [];
  
  const foundAd = brandAds.find(ad => x >= ad.x1 && x <= ad.x2 && y >= ad.y1 && y <= ad.y2);
  
  if (foundAd && foundAd !== hoveredAd) {
    // Remove existing tooltip
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
    
    hoveredAd = foundAd;
    canvas.style.cursor = 'pointer';
    
    // Create new tooltip
    tooltip = document.createElement('div');
    tooltip.id = 'adTooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.left = event.clientX + 10 + 'px';
    tooltip.style.top = event.clientY - 10 + 'px';
    tooltip.style.background = 'rgba(0,0,0,0.9)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '6px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = '1000';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.maxWidth = '250px';
    tooltip.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">${foundAd.meta.advertiser}</div>
      <div style="margin-bottom: 2px;">${foundAd.meta.message}</div>
      <div style="color: #4ade80;">${foundAd.meta.website}</div>
    `;
    document.body.appendChild(tooltip);
  } else if (!foundAd && hoveredAd) {
    hoveredAd = null;
    canvas.style.cursor = 'default';
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
  } else if (foundAd && tooltip) {
    // Update tooltip position as mouse moves
    tooltip.style.left = event.clientX + 10 + 'px';
    tooltip.style.top = event.clientY - 10 + 'px';
  }
}

function clearTooltip() {
  hoveredAd = null;
  canvas.style.cursor = 'default';
  if (tooltip) {
    tooltip.remove();
    tooltip = null;
  }
}

// Add hover event listeners
// Hover disabled for production
// canvas.addEventListener('mousemove', handleAdHover);
// canvas.addEventListener('mouseleave', clearTooltip);

// ① Tema reklam bölgesi
const temaRegion = { x1: 750, y1: 0, x2: 999, y2: 24 };

// sold olarak işaretle (seçilemesin)
for (let y = temaRegion.y1; y <= temaRegion.y2; y++) {
  for (let x = temaRegion.x1; x <= temaRegion.x2; x++) {
    soldParcels.add(y * gridSize + x);
  }
}

// ② drawTemaAd fonksiyonu
function drawTemaAd() {
    const img = document.getElementById('temaAd');
    if (!img.complete) {
      img.onload = drawGrid;
      return;
    }
    
    const { x1, y1, x2, y2 } = temaRegion;
    ctx.drawImage(
      img,
      x1*cellSize, y1*cellSize,
      (x2-x1+1)*cellSize, (y2-y1+1)*cellSize
    );
  }

  // — new advertisement regions —
// two above Nike (y: 600–624, x: 625–999)
const ad1Region = { x1: 625, y1: 600, x2: 999, y2: 624 };
const ad2Region = { x1: 625, y1: 575, x2: 999, y2: 599 };

// four below Nike (y: 750–874 split into 4 strips)
const ad3Region = { x1: 625, y1: 750, x2: 749, y2: 874 };
const ad4Region = { x1: 750, y1: 750, x2: 874, y2: 874 };
const ad5Region = { x1: 875, y1: 750, x2: 999, y2: 874 };
const ad6Region = { x1: 625, y1: 875, x2: 874, y2: 999 };

// green‐zone 250×500 block at bottom‑left
const ad7Region = { x1: 0, y1: 0, x2: 499, y2: 249 };  // adjust coords if needed

// mark them sold so they can't be selected
[ad1Region,ad2Region,ad3Region,ad4Region,ad5Region,ad6Region,ad7Region].forEach(r => {
  for(let y=r.y1;y<=r.y2;y++) for(let x=r.x1;x<=r.x2;x++)
    soldParcels.add(y*gridSize + x);
});

// helper to draw any ad
function drawAd(region, imgId) {
  const img = document.getElementById(imgId);
  if (!img) {
    
    return;
  }
  
  if (!img.complete || img.naturalWidth === 0) { 
    
    img.onload = () => {
      
      drawGrid(); // Redraw when image loads
    };
    img.onerror = () => {
      
    };
    return; 
  }
  
  // Yeni format için uyumluluk
  let x1, y1, x2, y2;
  if (region.x !== undefined) {
    // Yeni format: {x, y, w, h}
    x1 = region.x;
    y1 = region.y;
    x2 = region.x + region.w - 1;
    y2 = region.y + region.h - 1;
  } else {
    // Eski format: {x1, y1, x2, y2}
    x1 = region.x1;
    y1 = region.y1;
    x2 = region.x2;
    y2 = region.y2;
  }
  
  // draw ad image onto canvas
  ctx.drawImage(
    img,
    x1*cellSize, y1*cellSize,
    (x2-x1+1)*cellSize,
    (y2-y1+1)*cellSize
  );
}




function drawGrid() {
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 1) Fill big zones with lightweight patterns
  // Green zone: y>=500
  ctx.fillStyle = getZonePattern('green');
  ctx.fillRect(0, 500 * cellSize, canvas.width, (gridSize - 500) * cellSize);
  
  // Pink zone: x<500, y<500
  ctx.fillStyle = getZonePattern('pink');
  ctx.fillRect(0, 0, 500 * cellSize, 500 * cellSize);
  
  // Yellow zone: 500<=x<750, y<500
  ctx.fillStyle = getZonePattern('yellow');
  ctx.fillRect(500 * cellSize, 0, (750 - 500) * cellSize, 500 * cellSize);
  
  // Orange zone: x>=750, y<250
  ctx.fillStyle = getZonePattern('orange');
  ctx.fillRect(750 * cellSize, 0, (gridSize - 750) * cellSize, 250 * cellSize);
  
  // 2) Draw reserved/ads as overlays (optional dark base for contrast)
  // Nike block base
  ctx.fillStyle = '#000';
  ctx.fillRect(625 * cellSize, 625 * cellSize, (999 - 625 + 1) * cellSize, (749 - 625 + 1) * cellSize);
  // TEMA strip base
  ctx.fillRect(temaRegion.x1 * cellSize, temaRegion.y1 * cellSize, (temaRegion.x2 - temaRegion.x1 + 1) * cellSize, (temaRegion.y2 - temaRegion.y1 + 1) * cellSize);
  // Other ad regions base
  [ad1Region, ad2Region, ad3Region, ad4Region, ad5Region, ad6Region, ad7Region].forEach(r => {
    ctx.fillRect(r.x1 * cellSize, r.y1 * cellSize, (r.x2 - r.x1 + 1) * cellSize, (r.y2 - r.y1 + 1) * cellSize);
  });
  
  // 3) Draw advertisements (images)
  // Defer image draws to idle slices to keep first paint fast
  scheduleIdle(() => { try { drawNikeAd(); } catch(e) {} }, 100);
  scheduleIdle(() => { try { drawTemaAd(); } catch(e) {} }, 150);
  const adRegions = [
    [ad1Region, 'ad1'],
    [ad2Region, 'ad2'],
    [ad3Region, 'ad3'],
    [ad4Region, 'ad4'],
    [ad5Region, 'ad5'],
    [ad6Region, 'ad6'],
    [ad7Region, 'ad7']
  ];
  adRegions.forEach(([region, id], idx) => {
    scheduleIdle(() => { try { drawAd(region, id); } catch(e) {} }, 200 + idx*80);
  });
}




// --- Selection summary and state ---
let selectedRect = null;
let dragStart    = null;

function updateSelectedSummary() {
  const box = document.getElementById('selectedBox');
  const div = document.getElementById('selectedSummary');
  box.classList.remove('hidden');

  if (!selectedRect) {
    div.innerHTML = '';
    return;
  }

  const { x1, y1, x2, y2, zone } = selectedRect;
  const width    = x2 - x1 + 1;
  const height   = y2 - y1 + 1;
  const count    = selectedRect.parcels ? selectedRect.parcels.length : width * height;
  let totalPrice = 0;

  if (zone === 'green') {
    // Fixed price: $1.00 per parcel (but lucky parcels are free)
    if (selectedRect.parcels) {
      // Count only the original parcels (not lucky ones)
      const originalParcels = selectedRect.parcels.filter(p => !p.isLucky);
      const luckyParcels = selectedRect.parcels.filter(p => p.isLucky);
      
      // Original parcels cost $1.00 each, lucky parcels are free
      totalPrice = originalParcels.length * 1.00;
      
      // Add spin cost ($1.00 per spin)
      totalPrice += spinCount * 1.00;
      
      // Show info about lucky parcels
      if (luckyParcels.length > 0) {
        totalPrice += 0; // Lucky parcels are free
      }
    } else {
      // Fallback to bounding box calculation
      totalPrice = count * 1.00;
      // Add spin cost
      totalPrice += spinCount * 1.00;
    }
  } else if (zone === 'pink') {
    totalPrice = count * 15;
  } else if (zone === 'yellow') {
    // Yellow zone: $0.001 per parcel
    totalPrice = count * 0.001;
  } else {
    // orange rent
    totalPrice = count * 0.05;
  }

  const message =
    zone === 'green' ? 
      spinCount > 0 ? 
        `Ad here forever: $${(totalPrice - spinCount * 1.00).toFixed(2)} + ${spinCount} spins = $${totalPrice.toFixed(2)} total` :
        `Ad here forever: $${totalPrice.toFixed(2)}` :
    zone === 'pink'  ? `Start bid for these parcels: $${totalPrice.toFixed(2)}` :
                       `Rent here: $${totalPrice.toFixed(2)}`;

  // Bütçe limiti ve fiyat uyarıları
  const budgetWarning = budgetLimit && totalPrice > budgetLimit ? 
    `<div class="text-red-400 text-xs font-bold">⚠️ Exceeds budget limit!</div>` : '';
  
  const budgetInfo = budgetLimit ? 
    `<div class="text-blue-400 text-xs font-bold">💰 Current Budget: $${budgetLimit.toFixed(2)}</div>` : '';

  // Calculate lucky parcels count
  const luckyParcelsCount = selectedRect.parcels ? 
    selectedRect.parcels.filter(p => p.isLucky).length : 0;
  
  const totalParcelsText = luckyParcelsCount > 0 ? 
    `Total parcels: <strong>${count}</strong> (${luckyParcelsCount} parcels won from spins)` :
    `Total parcels: <strong>${count}</strong>`;

  div.innerHTML = `
    <div class="flex justify-between items-start flex-col space-y-2">
      <div>
        <span style="color:${zoneColors[zone]}">${zone.toUpperCase()}</span> zone<br>
        (${x1}, ${y1}) to (${x2}, ${y2})<br>
        ${totalParcelsText}
      </div>
      <div class="text-sm font-bold text-green-400">${message}</div>
      ${budgetInfo}
      ${budgetWarning}
      <button class="text-red-400 text-xl font-bold" onclick="clearSelection()">×</button>
    </div>
  `;
  
  // Update Buy Parcels button based on zone
  updateBuyButton(zone);
}

function updateBuyButton(zone) {
  const buyButton = document.getElementById('buyButton');
  
  if (zone === 'pink') {
    // Pink zone: Disable button (gray and passive)
    buyButton.className = 'bg-gray-500 text-gray-300 px-4 py-2 rounded font-semibold cursor-not-allowed opacity-50';
    buyButton.disabled = true;
    buyButton.textContent = 'Bidding Zone - Coming Soon';
  } else if (zone === 'yellow') {
    // Yellow zone: Yellow button with FOMO
    buyButton.className = 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-3 rounded-lg font-bold hover:from-yellow-300 hover:to-orange-400 animate-pulse shadow-lg border-2 border-yellow-300';
    buyButton.disabled = false;
    buyButton.textContent = '🚀 BUY PARCELS NOW! 🚀';
  } else if (zone === 'orange') {
    // Orange zone: Orange button with FOMO
    buyButton.className = 'bg-gradient-to-r from-orange-400 to-red-500 text-black px-6 py-3 rounded-lg font-bold hover:from-orange-300 hover:to-red-400 animate-pulse shadow-lg border-2 border-orange-300';
    buyButton.disabled = false;
    buyButton.textContent = '🚀 BUY PARCELS NOW! 🚀';
  } else {
    // Green zone: Default green button with FOMO
    buyButton.className = 'bg-gradient-to-r from-green-400 to-emerald-500 text-black px-6 py-3 rounded-lg font-bold hover:from-green-300 hover:to-emerald-400 animate-pulse shadow-lg border-2 border-green-300';
    buyButton.disabled = false;
    buyButton.textContent = '🚀 BUY PARCELS NOW! 🚀';
  }
}

function drawSelectionBox(rect) {
  ctx.fillStyle = 'rgba(59,130,246,0.8)';
  
  if (rect.parcels) {
    // Draw only the actual selected parcels
    rect.parcels.forEach(parcel => {
      const idx = parcel.y * gridSize + parcel.x;
      if (!soldParcels.has(idx)) {
        // Draw individual parcel with larger frame
        ctx.fillRect((parcel.x - 2) * cellSize, (parcel.y - 2) * cellSize, cellSize * 5, cellSize * 5);
      }
    });
    
    // Add finger emoji to first parcel
    if (rect.parcels.length > 0) {
      const firstParcel = rect.parcels[0];
      const fingerX = firstParcel.x * cellSize + cellSize / 2;
      const fingerY = firstParcel.y * cellSize + cellSize / 2;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👆', fingerX, fingerY);
    }
  } else {
    // Original bounding box logic for other zones
  const parcelCount = (rect.x2 - rect.x1 + 1) * (rect.y2 - rect.y1 + 1);
  
  for (let yy = rect.y1; yy <= rect.y2; yy++) {
    for (let xx = rect.x1; xx <= rect.x2; xx++) {
      const idx = yy * gridSize + xx;
      if (!soldParcels.has(idx)) {
        if (parcelCount === 1) {
          ctx.fillRect((xx - 4) * cellSize, (yy - 4) * cellSize, cellSize * 10, cellSize * 10);
        } else {
            ctx.fillRect((xx - 2) * cellSize, (yy - 2) * cellSize, cellSize * 5, cellSize * 5);
          }
        }
      }
    }
    
    // Parmak işareti ekle (seçilen alanın ortasına)
    const centerX = (rect.x1 + rect.x2) / 2;
    const centerY = (rect.y1 + rect.y2) / 2;
    const fingerX = centerX * cellSize + cellSize / 2;
    const fingerY = centerY * cellSize + cellSize / 2;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👆', fingerX, fingerY);
  }
}

// --- Zoom function ---
function setZoom(newZoom) {
  zoomLevel = Math.max(minZoom, Math.min(maxZoom, newZoom));
  canvas.style.transform = `scale(${zoomLevel})`;
  canvas.style.transformOrigin = 'top left';
}

// --- Mouse wheel zoom (DISABLED) ---
// canvas.addEventListener('wheel', e => {
//   e.preventDefault();
//   const delta = e.deltaY > 0 ? -0.1 : 0.1;
//   setZoom(zoomLevel + delta);
// });

// --- Touch pinch zoom ---
let lastTouchDistance = 0;
let initialZoom = 1;

canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    lastTouchDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    initialZoom = zoomLevel;
  }
});

canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 2) {
  e.preventDefault();
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    
    if (lastTouchDistance > 0) {
      const scale = currentDistance / lastTouchDistance;
      const newZoom = initialZoom * scale;
      setZoom(newZoom);
    }
  }
});

canvas.addEventListener('touchend', e => {
  if (e.touches.length < 2) {
    lastTouchDistance = 0;
  }
});

// --- Grid Selection Disabled ---
// Grid selection is now disabled. Users can only use Early Bird package.

// --- Grid Click Handler (Early Bird Only) ---
canvas.addEventListener('click', e => {
  const b = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - b.left) * (canvas.width / b.width) / cellSize);
  const y = Math.floor((e.clientY - b.top)  * (canvas.height / b.height) / cellSize);
  
  // Check if clicking on existing ads (Nike, TEMA, etc.)
  if (x >= 625 && x <= 999 && y >= 625 && y <= 749) {
    // Nike ad region - show details
    openParcelDetails(
      document.getElementById('nikeAd').src,
      `
        <p><strong>Advertiser:</strong> Nike®</p>
        <p><strong>Zone:</strong> Green</p>
        <p><strong>Coordinates:</strong> (625,625) to (999,749)</p>
        <p><strong>Parcel Count:</strong> 375×125 = 46875</p>
        <p><strong>Price Paid:</strong> $16406.25</p>
        <p><strong>Message:</strong> Just Do It.</p>
      `
    );
    return;
  }
  
  // Check if clicking on TEMA region
  if (x >= temaRegion.x1 && x <= temaRegion.x2 && y >= temaRegion.y1 && y <= temaRegion.y2) {
    openParcelDetails(
      document.getElementById('temaAd').src,
      `
        <p><strong>This area is reserved for TEMA Foundation.</strong></p>
        <p><strong>Seedling Donation / Month:</strong> 15,000</p>
        <p><strong>Daily Price:</strong> $312.50</p>
        <p><strong>Monthly Price:</strong> $9,375.00</p>
        <p><strong>Number of Parcels Reserved:</strong> 6250</p>
      `
    );
    return;
  }
  
  // Check if clicking on other ads
  const advertisementsMeta = [
    { region: ad1Region, imgId: 'ad1', advertiser: 'McDonald\'s Corporation', price: '$51,250.00', zone: 'Green' },
    { region: ad2Region, imgId: 'ad2', advertiser: 'Walmart Inc.', price: '$51,250.00', zone: 'Green' },
    { region: ad3Region, imgId: 'ad3', advertiser: 'Rockstar Games', price: '$77,000.00', zone: 'Green' },
    { region: ad4Region, imgId: 'ad4', advertiser: 'Yum! Brands Inc.', price: '$77,000.00', zone: 'Green' },
    { region: ad5Region, imgId: 'ad5', advertiser: 'BEKO', price: '$77,000.00', zone: 'Green' },
    { region: ad6Region, imgId: 'ad6', advertiser: 'Adidas AG', price: '$96,250.00', zone: 'Green' },
    { region: ad7Region, imgId: 'ad7', advertiser: 'Spotify AB', price: '$2,250,000', zone: 'Pink', special: true }
  ];

  for (const { region, imgId, advertiser, price, zone, special } of advertisementsMeta) {
    if (x >= region.x1 && x <= region.x2 && y >= region.y1 && y <= region.y2) {
      let metaHtml;
      
      if (special && imgId === 'ad7') {
        metaHtml = `
          <p><strong>Advertiser & Bid Winner:</strong> ${advertiser}</p>
          <p><strong>Zone:</strong> ${zone} Zone</p>
          <p><strong>Other Bidders:</strong> Çamoluk Otomotiv ($16) , RE/MAX ($17)</p>
          <p><strong>Coordinates:</strong> (${region.x1},${region.y1}) to (${region.x2},${region.y2})</p>
          <p><strong>Parcel Count:</strong> ${(region.x2 - region.x1 + 1)}×${(region.y2 - region.y1 + 1)} = ${(region.x2 - region.x1 + 1) * (region.y2 - region.y1 + 1)}</p>
          <p><strong>Price Paid:</strong> ${price}</p>
          <p><strong>Message:</strong> Sign up to get unlimited songs and podcasts with occasional ads. No credit card needed.</p>
        `;
      } else {
        metaHtml = `
          <p><strong>Advertiser:</strong> ${advertiser}</p>
          <p><strong>Zone:</strong> ${zone}</p>
          <p><strong>Coordinates:</strong> (${region.x1},${region.y1}) to (${region.x2},${region.y2})</p>
          <p><strong>Parcel Count:</strong> ${(region.x2 - region.x1 + 1)}×${(region.y2 - region.y1 + 1)} = ${(region.x2 - region.x1 + 1) * (region.y2 - region.y1 + 1)}</p>
          <p><strong>Price Paid:</strong> ${price}</p>
          <p><strong>Message:</strong> Professional advertisement placement.</p>
        `;
      }
      
      openParcelDetails(
        document.getElementById(imgId).src,
        metaHtml
      );
      return;
    }
  }
  
  // Check if clicking on pink zone (bidding)
  const zone = getZone(x, y);
  if (zone === 'pink') {
    openBiddingModal();
    return;
  }
  
  // For all other clicks (empty grid areas), show Early Bird message
  alert('🚀 Due to high demand, only Early Bird sales are currently active!\n\nClick \'GRAB EARLY BIRD PACKAGE\' to secure your parcels with 99% OFF!');
  
  // Auto-scroll to Early Bird button
  const earlyBirdButton = document.querySelector('button[onclick="buyEarlyBird()"]');
  if (earlyBirdButton) {
    earlyBirdButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

// --- Click event for Parcel Details popup ---
canvas.addEventListener('click', e => {
  const b = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - b.left) * (canvas.width / b.width) / cellSize);
  const y = Math.floor((e.clientY - b.top)  * (canvas.height / b.height) / cellSize);
  // if within Nike advertisement region
  if (x >= 625 && x <= 999 && y >= 625 && y <= 749) {
    openParcelDetails(
      document.getElementById('nikeAd').src,
      `
        <p><strong>Advertiser:</strong> Nike®</p>
        <p><strong>Zone:</strong> Green</p>
        <p><strong>Coordinates:</strong> (625,625) to (999,749)</p>
        <p><strong>Parcel Count:</strong> 375×125 = 46875</p>
        <p><strong>Price Paid:</strong> $16406.25</p>
        <p><strong>Message:</strong> Just Do It.</p>
      `
    );
  }
});

canvas.addEventListener('click', e => {
  const b = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - b.left) * (canvas.width / b.width) / cellSize);
  const y = Math.floor((e.clientY - b.top)  * (canvas.height / b.height) / cellSize);

  // Skip if already handled by another click handler
  if ((x >= 625 && x <= 749) && (y >= 750 && y <= 874)) {
    // This is the region of ad3 – allow normal ad popup
    return;
  }

  // If in Pink zone but NOT ad3
  const zone = getZone(x, y);
  if (zone === 'pink') {
    openBiddingModal();
    return;
  }
});

// --- Click event for TEMA Vakfı Bölgesi ---
canvas.addEventListener('click', e => {
    const b = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - b.left) * (canvas.width / b.width) / cellSize);
    const y = Math.floor((e.clientY - b.top)  * (canvas.height / b.height) / cellSize);
  
    // TEMA bölgesine tıklanmış mı?
    if (x >= temaRegion.x1 && x <= temaRegion.x2
     && y >= temaRegion.y1 && y <= temaRegion.y2) {
  
      openParcelDetails(
        document.getElementById('temaAd').src,
        `
    <p><strong>This area is reserved for TEMA Foundation.</strong></p>
    <p><strong>Seedling Donation / Month:</strong> 15,000</p>
    <p><strong>Daily Price:</strong> $312.50</p>
    <p><strong>Monthly Price:</strong> $9,375.00</p>
    <p><strong>Number of Parcels Reserved:</strong> 6250</p>
        `
      );
    }
  });

// --- Click event for advertisements ---
canvas.addEventListener('click', e => {
  const b = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - b.left) * (canvas.width / b.width) / cellSize);
  const y = Math.floor((e.clientY - b.top)  * (canvas.height / b.height) / cellSize);

  const advertisementsMeta = [
    { region: ad1Region, imgId: 'ad1', advertiser: 'McDonald\'s Corporation', price: '$51,250.00', zone: 'Green' },
    { region: ad2Region, imgId: 'ad2', advertiser: 'Walmart Inc.', price: '$51,250.00', zone: 'Green' },
    { region: ad3Region, imgId: 'ad3', advertiser: 'Rockstar Games', price: '$77,000.00', zone: 'Green' },
    { region: ad4Region, imgId: 'ad4', advertiser: 'Yum! Brands Inc.', price: '$77,000.00', zone: 'Green' },
    { region: ad5Region, imgId: 'ad5', advertiser: 'BEKO', price: '$77,000.00', zone: 'Green' },
    { region: ad6Region, imgId: 'ad6', advertiser: 'Adidas AG', price: '$96,250.00', zone: 'Green' },
    { region: ad7Region, imgId: 'ad7', advertiser: 'Spotify AB', price: '$2,250,000', zone: 'Pink', special: true }
  ];

  for (const { region, imgId, advertiser, price, zone, special } of advertisementsMeta) {
    if (x >= region.x1 && x <= region.x2 && y >= region.y1 && y <= region.y2) {
      let metaHtml;
      
      if (special && imgId === 'ad7') {
        // Spotify AB için özel bilgiler
        metaHtml = `
          <p><strong>Advertiser & Bid Winner:</strong> ${advertiser}</p>
          <p><strong>Zone:</strong> ${zone} Zone</p>
          <p><strong>Other Bidders:</strong> Çamoluk Otomotiv ($16) , RE/MAX ($17)</p>
          <p><strong>Coordinates:</strong> (${region.x1},${region.y1}) to (${region.x2},${region.y2})</p>
          <p><strong>Parcel Count:</strong> ${(region.x2 - region.x1 + 1)}×${(region.y2 - region.y1 + 1)} = ${(region.x2 - region.x1 + 1) * (region.y2 - region.y1 + 1)}</p>
          <p><strong>Price Paid:</strong> ${price}</p>
          <p><strong>Message:</strong> Sign up to get unlimited songs and podcasts with occasional ads. No credit card needed.</p>
        `;
      } else {
        // Diğer advertisement'lar için normal bilgiler
        metaHtml = `
          <p><strong>Advertiser:</strong> ${advertiser}</p>
          <p><strong>Zone:</strong> ${zone}</p>
          <p><strong>Coordinates:</strong> (${region.x1},${region.y1}) to (${region.x2},${region.y2})</p>
          <p><strong>Parcel Count:</strong> ${(region.x2 - region.x1 + 1)}×${(region.y2 - region.y1 + 1)} = ${(region.x2 - region.x1 + 1) * (region.y2 - region.y1 + 1)}</p>
          <p><strong>Price Paid:</strong> ${price}</p>
          <p><strong>Message:</strong> Professional advertisement placement.</p>
        `;
      }
      
      openParcelDetails(
        document.getElementById(imgId).src,
        metaHtml
      );
      return;
    }
  }
});


// Buy button opens purchase modal
document.getElementById('buyButton').addEventListener('click', openModal);

canvas.addEventListener('click', e => {
  const b = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - b.left) * (canvas.width / b.width) / cellSize);
  const y = Math.floor((e.clientY - b.top)  * (canvas.height / b.height) / cellSize);

  const adRegions = {
    ad1: ad1Region,
    ad2: ad2Region,
    ad3: ad3Region,
    ad4: ad4Region,
    ad5: ad5Region,
    ad6: ad6Region,
    ad7: ad7Region
  };

  // Check if clicking on existing ads (still show details)
  for (const [imgId, region] of Object.entries(adRegions)) {
    if (x >= region.x1 && x <= region.x2 && y >= region.y1 && y <= region.y2) {
      const meta = advertisementMeta[imgId];
      openParcelDetails(
        document.getElementById(imgId).src,
        `
          <p><strong>Advertiser:</strong> ${meta.advertiser}</p>
          <p><strong>Zone:</strong> Green</p>
          <p><strong>Coordinates:</strong> ${meta.coords}</p>
          <p><strong>Parcel Count:</strong> ${meta.parcels}</p>
          <p><strong>Price Paid:</strong> $${meta.price.toFixed(2)}</p>
          <p><strong>Message:</strong> ${meta.message}</p>
        `
      );
      return;
    }
  }
  
  // For any other grid clicks, show Early Bird message
  alert("🚀 Due to high demand, only Early Bird sales are currently active!\n\nClick 'GRAB EARLY BIRD PACKAGE' to secure your parcels with 99% OFF!");
  
  // Auto-scroll to Early Bird button
  const earlyBirdButton = document.querySelector('button[onclick="buyEarlyBird()"]');
  if (earlyBirdButton) {
    earlyBirdButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

function openModal() {
  // Open purchase link in pop-up modal/iframe - NO validation needed, just sell!
  const purchaseLink = 'https://testingin1day.ikas.shop/adparcel-1-permanent-parcel-green-zonetamma';
  
  // Create modal if it doesn't exist
  let modal = document.getElementById('purchaseLinkModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'purchaseLinkModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center hidden z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] relative">
        <button onclick="closePurchaseLinkModal()" class="absolute top-2 right-3 text-xl font-bold text-red-600 hover:text-red-800">×</button>
        <iframe src="${purchaseLink}" class="w-full h-[85vh] border-0 rounded"></iframe>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Add close function globally
    window.closePurchaseLinkModal = function() {
      document.getElementById('purchaseLinkModal').classList.add('hidden');
    };
  }
  
  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('purchaseModal').classList.add('hidden');
}

function toggleDetails() {
    document.getElementById('detailsSection').classList.toggle('hidden');
  }


  // Old plain-text chat rotation removed and replaced by Chat-Parcel simulation above

  const headlines = [
    '🟢 Green zone prices rising – FOMO kicking in!',
    '🌳 Over 2,000 trees planted this week – thank you!',
    '💗 Bidding war in pink zone: $75 and counting!',
    '🚀 Parcel #499,500 just sold. Halfway there!',
    '🎨 New ad banner in orange zone just dropped!',
    '💬 Chat-Parcel feature launching soon!',
    '📈 AdParcel trending on TechCrunch!',
    '🔥 Only 10 premium parcels left in row 998!',
    '🏆 Top bidder of the day: user "PixMaster99"',
    '🧩 8 hidden parcels contain prizes 👀',
    '🌎 Rent your ad space for just 5¢ per day!',
    '💸 Passive income on digital land? Yes please.',
    '🎁 New bonus drops every 100k sold parcels!',
    '🔒 You now own part of the internet. Literally.',
    '📢 Green area nearly sold out! Act fast.',
  ];
  function updateTicker() {
    document.getElementById('tickerContent').textContent =
      headlines.join('   |  ');
  }
  updateTicker();
  // Eğer başlıkları değiştirip tekrar kaydırmak istersen:
  setInterval(() => {
    headlines.push(headlines.shift()); // başlığı sona at
    updateTicker();
  }, 20000);

  const advertisementMeta = {
    ad1: {
      advertiser:" McDonald's Corporation (MCD) ",
      coords: '(625, 750) to (749, 874)',
      parcels: 125 * 125,
      price: 93862.5,
      message: "I'm Lovin' It",
      website: "https://mcdonalds.com"
    },
    ad2: {
      advertiser: 'Walmart Inc.',
      coords: '(625, 575) to (999, 599)',
      parcels: 375 * 25,
      price: 99731.25,
      message: 'Save money, live better.',
      website: "https://walmart.com"
    },
    // Brand advertisement metadata
    brand1: {
      advertiser: 'Tesla Inc.',
      coords: '(100, 600) to (179, 679)',
      parcels: 80 * 80,
      price: 100000,
      message: 'Accelerating the world\'s transition to sustainable transport',
      website: "https://tesla.com"
    },
    brand2: {
      advertiser: 'Spotify Technology',
      coords: '(300, 550) to (379, 629)',
      parcels: 80 * 80,
      price: 100000,
      message: 'Music for everyone',
      website: "https://spotify.com"
    },
    brand3: {
      advertiser: 'Netflix Inc.',
      coords: '(500, 600) to (579, 679)',
      parcels: 80 * 80,
      price: 100000,
      message: 'See what\'s next',
      website: "https://netflix.com"
    },
    brand4: {
      advertiser: 'Airbnb Inc.',
      coords: '(700, 550) to (779, 629)',
      parcels: 80 * 80,
      price: 100000,
      message: 'Belong anywhere',
      website: "https://airbnb.com"
    },
    brand5: {
      advertiser: 'Uber Technologies',
      coords: '(200, 700) to (279, 779)',
      parcels: 80 * 80,
      price: 100000,
      message: 'Move the way you want',
      website: "https://uber.com"
    },
    brand6: {
      advertiser: 'Zoom Video Communications',
      coords: '(400, 700) to (479, 779)',
      parcels: 80 * 80,
      price: 100000,
      message: 'Video conferencing made simple',
      website: "https://zoom.us"
    },
    brand7: {
      advertiser: 'Slack Technologies',
      coords: '(600, 700) to (679, 779)',
      parcels: 80 * 80,
      price: 100000,
      message: 'Where work happens',
      website: "https://slack.com"
    },
    brand8: {
      advertiser: 'Shopify Inc.',
      coords: '(800, 600) to (879, 679)',
      parcels: 80 * 80,
      price: 100000,
      message: 'Build your business',
      website: "https://shopify.com"
    },
    brand9: {
      advertiser: 'Stripe Inc.',
      coords: '(100, 800) to (179, 879)',
      parcels: 80 * 80,
      price: 100000,
      message: 'Payments infrastructure for the internet',
      website: "https://stripe.com"
    },
    brand10: {
      advertiser: 'Canva Pty Ltd',
      coords: '(300, 800) to (379, 879)',
      parcels: 80 * 80,
      price: 100000,
      message: 'Design anything. Publish anywhere.',
      website: "https://canva.com"
    },
    brand11: {
      advertiser: 'Figma Inc.',
      coords: '(500, 800) to (579, 879)',
      parcels: 80 * 80,
      price: 100000,
      message: 'The collaborative interface design tool',
      website: "https://figma.com"
    },
    brand12: {
      advertiser: 'Notion Labs Inc.',
      coords: '(700, 800) to (779, 879)',
      parcels: 80 * 80,
      price: 100000,
      message: 'All-in-one workspace',
      website: "https://notion.so"
    },
    brand13: {
      advertiser: 'Discord Inc.',
      coords: '(200, 900) to (279, 979)',
      parcels: 80 * 80,
      price: 100000,
      message: 'Your place to talk',
      website: "https://discord.com"
    },
    brand14: {
      advertiser: 'GitHub Inc.',
      coords: '(400, 900) to (479, 979)',
      parcels: 80 * 80,
      price: 100000,
      message: 'Where the world builds software',
      website: "https://github.com"
    },
    brand15: {
      advertiser: 'Figma Inc.',
      coords: '(600, 900) to (679, 979)',
      parcels: 80 * 80,
      price: 100000,
      message: 'The collaborative interface design tool',
      website: "https://figma.com"
    },
    brand16: {
      advertiser: 'Linear Technologies',
      coords: '(800, 800) to (879, 879)',
      parcels: 80 * 80,
      price: 100000,
      message: 'Built for speed',
      website: "https://linear.app"
    },
    brand17: {
      advertiser: 'Vercel Inc.',
      coords: '(100, 900) to (199, 979)',
      parcels: 100 * 80,
      price: 100000,
      message: 'Develop. Preview. Ship.',
      website: "https://vercel.com"
    },
    brand18: {
      advertiser: 'Supabase Inc.',
      coords: '(300, 900) to (379, 999)',
      parcels: 80 * 100,
      price: 100000,
      message: 'The open source Firebase alternative',
      website: "https://supabase.com"
    },
    brand19: {
      advertiser: 'PlanetScale Inc.',
      coords: '(500, 900) to (619, 979)',
      parcels: 120 * 80,
      price: 100000,
      message: 'The database platform for developers',
      website: "https://planetscale.com"
    },
    brand20: {
      advertiser: 'Railway Inc.',
      coords: '(700, 900) to (779, 999)',
      parcels: 80 * 100,
      price: 100000,
      message: 'Deploy code, not infrastructure',
      website: "https://railway.app"
    },
    ad3: {
      advertiser: 'Rockstar Games',
      coords: '(625, 750) to (749, 874)',
      parcels: 125 * 125,
      price: 78318.75,
      message: "Bringing Gaming to Life. (MAY 26 2026)"
    },
    ad4: {
      advertiser: 'Yum! Brands, Inc. (Yum!)',
      coords: '(750, 750) to (874, 874)',
      parcels: 125 * 125,
      price: 78318.75,
      message: "To build the world's most loved, trusted and successful restaurant brands."
    },
    ad5: {
      advertiser: 'BEKO',
      coords: '(875, 750) to (999, 874)',
      parcels: 125 * 125,
      price: 78318.75,
      message: 'Evimize sağlık. (Bringing Wellness Home)'
    },
    ad6: {
      advertiser: 'Adidas AG',
      coords: '(625, 875) to (874, 999)',
      parcels: 250 * 125,
      price: 78318.75,
      message: "You've Got This."
    },
    ad7: {
      advertiser: 'Spotify AB',
      coords: '(0, 0) to (499, 249)',
      parcels: 500 * 250,
      price: 58987.5,
      message: 'Sign up to get unlimited songs and podcasts with occasional ads. No credit card needed.'
    }
  };

// initial draw
drawGrid();

// Removed magnifierCanvas and related mousemove/mouseleave event listeners and logic

function updateSidebarStats() {
  const sold = soldParcels.size;
  const total = gridSize * gridSize;
  const available = total - sold;

  // TEMA bölgesi dışındaki advertisement gelir toplamı
  const revenue = 16406.25 + 5125 + 5125 + 7700 + 7700 + 7700 + 9625 + 17500;

  // Tree sayısı: Sabit 820
  const plantedTrees = 820;

  // Güncelle
  const soldCountEl = document.getElementById('soldCount');
  const availableCountEl = document.getElementById('availableCount');
  const treeCountEl = document.getElementById('treeCount');
  const revenueAmountEl = document.getElementById('revenueAmount');
  
  // Curated display values for realism (must sum to 1,000,000)
  const SOLD_DISPLAY_OVERRIDE = 274346;
  const AVAILABLE_DISPLAY_OVERRIDE = 1000000 - SOLD_DISPLAY_OVERRIDE; // 725,654
  if (soldCountEl) soldCountEl.textContent = SOLD_DISPLAY_OVERRIDE.toLocaleString();
  if (availableCountEl) availableCountEl.textContent = AVAILABLE_DISPLAY_OVERRIDE.toLocaleString();
  if (treeCountEl) treeCountEl.textContent = plantedTrees.toLocaleString();
  if (revenueAmountEl) revenueAmountEl.textContent = `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

updateSidebarStats();

function updateStats() {
  const totalParcels = gridSize * gridSize;
  const sold = soldParcels.size;
  const available = totalParcels - sold;

  const advertisementRevenues = {
    ad1: 5125,
    ad2: 5125,
    ad3: 7700,
    ad4: 7700,
    ad5: 7700,
    ad6: 9625,
    ad7: 17500,
    nike:    16406.25
  };

  const totalRevenue = Object.values(advertisementRevenues).reduce((sum, v) => sum + v, 0);
  const treesPlanted = 820; // Sabit tree sayısı

  const soldCountEl = document.getElementById('soldCount');
  const availableCountEl = document.getElementById('availableCount');
  const treeCountEl = document.getElementById('treeCount');
  const revenueTotalEl = document.getElementById('revenueTotal');
  
  // Curated display values for realism (must sum to 1,000,000)
  const SOLD_DISPLAY_OVERRIDE = 274346;
  const AVAILABLE_DISPLAY_OVERRIDE = 1000000 - SOLD_DISPLAY_OVERRIDE; // 725,654
  if (soldCountEl) soldCountEl.textContent = SOLD_DISPLAY_OVERRIDE.toLocaleString();
  if (availableCountEl) availableCountEl.textContent = AVAILABLE_DISPLAY_OVERRIDE.toLocaleString();
  if (treeCountEl) treeCountEl.textContent = treesPlanted.toLocaleString();
  if (revenueTotalEl) revenueTotalEl.textContent = `$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2})}`;
}



drawAd(ad7Region, 'ad7');
updateStats(); 

// Clear selection function
function clearSelection() {
  selectedRect = null;
  spinCount = 0; // Reset spin count
  drawGrid();
  updateSelectedSummary();
  document.getElementById('selectedBox').classList.add('hidden');
  
  // Reset Buy Parcels button to default FOMO style
  const buyButton = document.getElementById('buyButton');
  buyButton.className = 'bg-gradient-to-r from-green-400 to-emerald-500 text-black px-6 py-3 rounded-lg font-bold hover:from-green-300 hover:to-emerald-400 animate-pulse shadow-lg border-2 border-green-300';
  buyButton.disabled = false;
  buyButton.textContent = '🚀 BUY PARCELS NOW! 🚀';
  
  // Reset Lucky button
  const luckButton = document.querySelector('button[onclick="tryLuck()"]');
  if (luckButton) {
    luckButton.dataset.won = 'false';
    luckButton.disabled = false;
    luckButton.textContent = '🎰 I FEEL LUCKY! 🎰';
    luckButton.className = 'w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black py-2 rounded font-bold hover:from-yellow-300 hover:to-orange-400 animate-bounce animate-pulse';
  }
  
  // Hide luck result
  const resultDiv = document.getElementById('luckResult');
  if (resultDiv) {
    resultDiv.classList.add('hidden');
  }
}

// --- Premium Modal Functions ---
function openPremiumModal() {
  document.getElementById('premiumModal').classList.remove('hidden');
  document.body.classList.add('modal-open');
  
  // Start networking animation
  startNetworkingAnimation();
}

function closePremiumModal() {
  document.getElementById('premiumModal').classList.add('hidden');
  document.body.classList.remove('modal-open');
  
  // Stop all networking animations
  if (window.networkingInterval) {
    clearInterval(window.networkingInterval);
  }
  if (window.connectionInterval) {
    clearInterval(window.connectionInterval);
  }
  if (window.chatInterval) {
    clearInterval(window.chatInterval);
  }
}

function startNetworkingAnimation() {
  const connectionCounter = document.getElementById('connectionCounter');
  const collaborationCounter = document.getElementById('collaborationCounter');
  const companyCount = document.getElementById('companyCount');
  const professionalCount = document.getElementById('professionalCount');
  const opportunityCount = document.getElementById('opportunityCount');
  const networkingMessage = document.getElementById('networkingMessage');
  const platformName = document.getElementById('platformName');
  const liveOpportunities = document.getElementById('liveOpportunities');
  
  let connections = 2847;
  let collaborations = 156;
  let companies = 847;
  let professionals = 3421;
  let opportunities = 89;
  
  const networkingMessages = [
    "Connect with industry leaders and unlock exclusive opportunities!",
    "Join the most exclusive advertising network in the industry!",
    "Network with Fortune 500 companies and startups alike!",
    "Discover collaboration opportunities that change careers!",
    "Build meaningful connections in the advertising ecosystem!",
    "Access exclusive industry events and masterclasses!",
    "Connect with investors and potential business partners!",
    "Join the elite circle of advertising professionals!"
  ];
  
  const platformNames = [
    'AdParcel Premium Network',
    'Industry Connect Pro',
    'Advertising Elite Network',
    'Professional Collaboration Hub',
    'Business Networking Platform'
  ];
  
  const opportunityMessages = [
    "💼 TechCorp seeking marketing partnership",
    "🤝 Creative agency collaboration opportunity",
    "📈 Investment opportunity in ad tech",
    "🎯 Startup looking for advertising expertise",
    "💡 Innovation lab seeking creative minds",
    "🚀 Scale-up company needs marketing strategy",
    "🎨 Design agency seeking tech partnerships",
    "📊 Analytics company looking for data experts"
  ];
  
  const networkingChatMessages = [
    "Sarah_Chen: Just closed a $50K deal through this network!",
    "Mike_Johnson: The collaboration tools here are incredible",
    "Emma_Wilson: Met my co-founder through AdParcel Premium!",
    "David_Lee: This platform changed my career trajectory",
    "Lisa_Garcia: The networking events are top-notch",
    "Tom_Anderson: Found 3 new clients this month alone",
    "Anna_Smith: The industry insights are priceless",
    "Chris_Brown: Best investment I've made for my business",
    "Maria_Rodriguez: The community here is amazing",
    "James_Taylor: Networking has never been this easy",
    "Jennifer_Davis: Premium features are worth every penny",
    "Robert_Miller: The collaboration opportunities are endless",
    "Michelle_White: This is the future of professional networking",
    "Kevin_Thomas: The ROI on this membership is incredible",
    "Amanda_Harris: Met industry leaders I never thought possible",
    "Daniel_Martin: The platform connects the right people",
    "Jessica_Thompson: The networking events are game-changers",
    "Ryan_Garcia: This is how business networking should be",
    "Nicole_Martinez: The collaboration tools are revolutionary",
    "Alex_Martinez: Premium membership pays for itself quickly"
  ];
  
  // Main networking animation
  window.networkingInterval = setInterval(() => {
    // Update counters
    connections += Math.floor(Math.random() * 5) + 1;
    collaborations += Math.floor(Math.random() * 2);
    companies += Math.floor(Math.random() * 3);
    professionals += Math.floor(Math.random() * 8) + 2;
    opportunities += Math.floor(Math.random() * 2);
    
    connectionCounter.textContent = connections.toLocaleString();
    collaborationCounter.textContent = collaborations.toLocaleString();
    companyCount.textContent = companies.toLocaleString();
    professionalCount.textContent = professionals.toLocaleString();
    opportunityCount.textContent = opportunities.toLocaleString();
    
    // Update networking message
    const randomMessage = networkingMessages[Math.floor(Math.random() * networkingMessages.length)];
    networkingMessage.textContent = `"${randomMessage}"`;
    
    // Update platform name occasionally
    if (Math.random() > 0.8) {
      const randomPlatform = platformNames[Math.floor(Math.random() * platformNames.length)];
      platformName.textContent = randomPlatform;
    }
    
    // Update live opportunities
    const randomOpportunity = opportunityMessages[Math.floor(Math.random() * opportunityMessages.length)];
    const opportunityElement = liveOpportunities.querySelector('div');
    opportunityElement.textContent = randomOpportunity;
    
    // Add vibration effect (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    
  }, 2000);
  
  // Add networking chat system
  window.chatInterval = setInterval(() => {
    const networkingChat = document.getElementById('networkingChat');
    const randomMessage = networkingChatMessages[Math.floor(Math.random() * networkingChatMessages.length)];
    
    // Create new chat message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'animate-pulse text-xs';
    messageDiv.innerHTML = `<span class="text-blue-300 font-bold">${randomMessage}</span>`;
    
    // Add to chat
    networkingChat.appendChild(messageDiv);
    
    // Keep only last 15 messages
    while (networkingChat.children.length > 15) {
      networkingChat.removeChild(networkingChat.firstChild);
    }
    
    // Auto scroll to bottom
    networkingChat.scrollTop = networkingChat.scrollHeight;
    
  }, 1200);
} 

function preloadLogos() {
  
  Object.entries(logoSources).forEach(([key, src]) => {
    const tryLoad = (primary, fallback) => {
      const img = new Image();
      img.onload = () => {
        logoImages[key] = img;
        drawGrid();
      };
      img.onerror = () => {
        if (fallback && fallback !== primary) {
          const img2 = new Image();
          img2.onload = () => {
            logoImages[key] = img2;
            drawGrid();
          };
          img2.onerror = () => { logoImages[key] = null; };
          img2.src = fallback;
        } else {
          logoImages[key] = null;
        }
      };
      img.decoding = 'async';
      img.src = primary;
    };
    // Prefer .webp if available; fallback to original
    const webpCandidate = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    if (webpCandidate !== src) {
      tryLoad(webpCandidate, src);
    } else {
      tryLoad(src, null);
    }
  });
}

// Kick off preloading after DOM is ready
// Deferred to idle/first interaction via bootstrapNonCritical

function drawLogoOrText(centerX, centerY, adKeyText, adInfo = null) {
  const img = logoImages[adKeyText];
  
  /* debug: logo draw info */ /*
  console.log(`Drawing logo for ${adKeyText}:`, {
    imgExists: !!img,
    imgComplete: img ? img.complete : false,
    imgNaturalWidth: img ? img.naturalWidth : 0,
    imgNaturalHeight: img ? img.naturalHeight : 0,
    logoImagesKeys: Object.keys(logoImages)
  });
  */
  
  // Check if image exists and is loaded
  if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
    
    
    // Use the actual image dimensions - don't force resize
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    
    // Limit to ad area but keep original aspect ratio
    let maxWidth, maxHeight;
    if (adInfo) {
      // Use the actual ad dimensions
      const adWidth = (adInfo.x2 - adInfo.x1 + 1) * cellSize;
      const adHeight = (adInfo.y2 - adInfo.y1 + 1) * cellSize;
      maxWidth = adWidth * 0.9; // 90% of ad width
      maxHeight = adHeight * 0.9; // 90% of ad height - daha büyük olması için
    } else {
      // Fallback to fixed size
      maxWidth = cellSize * 8;
      maxHeight = cellSize * 6;
    }
    
    // Scale to fit but maintain aspect ratio
    const scale = Math.min(maxWidth / iw, maxHeight / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    
    
    
    // Draw the logo
    ctx.drawImage(img, centerX - dw / 2, centerY - dh / 2, dw, dh);
  } else {
    // Fallback: Draw text if logo is not available
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(adKeyText, centerX, centerY);
  }
}
