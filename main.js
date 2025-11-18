// main.js for AdParcel (MOBILE GRID FIX)

// --- 1. Global Değişkenler ---
const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 1000;
let cellSize = 13;
const soldParcels = new Set(); 

// --- 2. Reklam Bölgeleri ---
const temaRegion = { x1: 750, y1: 0, x2: 999, y2: 24 };
const nikeRegion = { x1: 625, y1: 625, x2: 999, y2: 749 };
const ad1Region = { x1: 625, y1: 600, x2: 999, y2: 624 };
const ad2Region = { x1: 625, y1: 575, x2: 999, y2: 599 };
const ad3Region = { x1: 625, y1: 750, x2: 749, y2: 874 };
const ad4Region = { x1: 750, y1: 750, x2: 874, y2: 874 };
const ad5Region = { x1: 875, y1: 750, x2: 999, y2: 874 };
const ad6Region = { x1: 625, y1: 875, x2: 874, y2: 999 };
const ad7Region = { x1: 0, y1: 0, x2: 499, y2: 249 }; 

const advertisementsMeta = [
    { region: nikeRegion, imgId: 'nikeAd', advertiser: 'Nike®', price: '$16,406.25', zone: 'Green', message: 'Just Do It.' },
    { region: temaRegion, imgId: 'temaAd', advertiser: 'TEMA Foundation', price: '$9,375.00/mo', zone: 'Orange', message: 'This area is reserved for TEMA Foundation.' },
    { region: ad1Region, imgId: 'ad1', advertiser: 'McDonald\'s Corporation', price: '$51,250.00', zone: 'Green' },
    { region: ad2Region, imgId: 'ad2', advertiser: 'Walmart Inc.', price: '$51,250.00', zone: 'Green' },
    { region: ad3Region, imgId: 'ad3', advertiser: 'Rockstar Games', price: '$77,000.00', zone: 'Green' },
    { region: ad4Region, imgId: 'ad4', advertiser: 'Yum! Brands Inc.', price: '$77,000.00', zone: 'Green' },
    { region: ad5Region, imgId: 'ad5', advertiser: 'BEKO', price: '$77,000.00', zone: 'Green' },
    { region: ad6Region, imgId: 'ad6', advertiser: 'Adidas AG', price: '$96,250.00', zone: 'Green' },
    { region: ad7Region, imgId: 'ad7', advertiser: 'Spotify AB', price: '$2,250,000', zone: 'Pink', special: true }
];

advertisementsMeta.forEach(ad => {
    const r = ad.region;
    for (let y = r.y1; y <= r.y2; y++) {
        for (let x = r.x1; x <= r.x2; x++) {
            soldParcels.add(y * gridSize + x);
        }
    }
});

// --- 3. Başlangıç ---
(() => {
    const MAX_CANVAS_DIMENSION = 4096; 
    const desiredDimension = gridSize * cellSize;
    if (desiredDimension > MAX_CANVAS_DIMENSION) {
        cellSize = Math.max(1, Math.floor(MAX_CANVAS_DIMENSION / gridSize));
    }
    canvas.width = gridSize * cellSize;
    canvas.height = gridSize * cellSize;
})();

// Bu 'debounce' (geciktirme) fonksiyonu, çok fazla çizim emri gelirse sistemi yormaması için
let drawTimeout;
function requestDrawGrid() {
    if (drawTimeout) cancelAnimationFrame(drawTimeout);
    drawTimeout = requestAnimationFrame(drawGrid);
}

// --- 4. Çizim (DÜZELTİLDİ: SENKRONİZE) ---
function preloadAdImages() {
    const ids = ['nikeAd', 'temaAd', 'ad1', 'ad2', 'ad3', 'ad4', 'ad5', 'ad6', 'ad7'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.complete && el.naturalWidth > 0) {
            // Zaten yüklüyse çiz
            requestDrawGrid();
        } else {
            // Yüklenince çiz
            el.onload = () => requestDrawGrid();
            // Mobilde bazen lazy load tetiklenmez, src'yi resetlemek zorlar
            if(!el.src) {
               const dataSrc = el.getAttribute('src');
               el.src = dataSrc;
            }
        }
    });
}

function drawGrid() {
    // 1. Temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 2. HEPSİNİ AYNI ANDA ÇİZ (Bekleme yok)
    drawAdImage('nikeAd', nikeRegion);
    drawAdImage('temaAd', temaRegion);
    
    const adIds = ['ad1', 'ad2', 'ad3', 'ad4', 'ad5', 'ad6', 'ad7'];
    const regions = [ad1Region, ad2Region, ad3Region, ad4Region, ad5Region, ad6Region, ad7Region];
    
    for(let i=0; i<adIds.length; i++) {
        drawAdImage(adIds[i], regions[i]);
    }
}

function drawAdImage(imgId, region) {
    const img = document.getElementById(imgId);
    if (!img || !img.complete || img.naturalWidth === 0) {
        return; // Yüklenmemişse pas geç
    }
    const { x1, y1, x2, y2 } = region;
    ctx.drawImage(img, x1 * cellSize, y1 * cellSize, (x2 - x1 + 1) * cellSize, (y2 - y1 + 1) * cellSize);
}


// --- 5. Başlatıcılar ---
document.addEventListener('DOMContentLoaded', () => {
    preloadAdImages();
    requestDrawGrid(); // İlk çizim
    
    // Ekstra garanti: 1 saniye sonra tekrar çiz (mobil lag için)
    setTimeout(requestDrawGrid, 1000);
    setTimeout(requestDrawGrid, 3000);

    updateSidebarStats(); 
    updateTicker(); 

    const buyButton = document.getElementById('buyButton');
    if(buyButton) {
         buyButton.addEventListener('click', () => {
             openPurchaseModal(null); 
         });
    }
    
    canvas.addEventListener('click', handleGridClick);
    canvas.addEventListener('mousemove', handleGridHover);
    canvas.addEventListener('mouseleave', clearGridHover);
    
    // Logo Animasyonu
    const mainLogo = document.getElementById('mainLogo');
    const logoBackdrop = document.getElementById('logo-animation-backdrop');
    if(mainLogo && logoBackdrop) {
        mainLogo.addEventListener('click', () => {
            logoBackdrop.classList.remove('hidden');
            playLogoSlides(0);
        });
    }

    function playLogoSlides(index) {
        const slides = document.querySelectorAll('.logo-slide');
        if(index > 0) {
            slides[index-1].classList.remove('active');
        }
        if(index < slides.length) {
            slides[index].classList.add('active');
            setTimeout(() => playLogoSlides(index + 1), 2500);
        } else {
             document.getElementById('logo-animation-backdrop').classList.add('hidden');
        }
    }
    
    // Chat Simülasyonu Başlat
    startChatParcelSimulation();
});


// --- 6. Zon ve Tıklama Mantığı ---
function getZone(x, y) {
    if (y >= 500) return 'green';
    if (x < 500) return 'pink';
    if (x >= 750 && y < 250) return 'orange';
    if (x >= 500 && y < 500) return 'yellow';
    return 'green'; 
}

const cursorTooltip = document.getElementById('cursorTooltip');
const sidebarBox = document.getElementById('selectedBox');

function handleGridHover(e) {
    const b = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - b.left) * (canvas.width / b.width) / cellSize);
    const y = Math.floor((e.clientY - b.top) * (canvas.height / b.height) / cellSize);

    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
        cursorTooltip.classList.add('hidden');
        return;
    }
    if (sidebarBox) sidebarBox.classList.add('hidden');

    cursorTooltip.classList.remove('hidden');
    
    cursorTooltip.style.left = (e.clientX + 15) + 'px';
    cursorTooltip.style.top = (e.clientY - 40) + 'px';

    const zone = getZone(x,y);
    let colorClass = "text-green-400";
    if (zone === 'pink') colorClass = "text-pink-400";
    if (zone === 'yellow') colorClass = "text-yellow-400";
    if (zone === 'orange') colorClass = "text-orange-400";
    
    cursorTooltip.style.borderColor = zone === 'pink' ? '#ec4899' : 
                                      zone === 'yellow' ? '#facc15' :
                                      zone === 'orange' ? '#fb923c' : '#22c55e';

    cursorTooltip.innerHTML = `
        <div class="flex flex-col gap-0.5">
            <div class="flex justify-between items-center border-b border-gray-700/50 pb-1 mb-1">
                 <span class="font-bold uppercase ${colorClass}">${zone}</span>
                 <span class="text-[10px] text-gray-400">ZONE</span>
            </div>
            <div class="text-center">
                <span class="text-lg font-mono font-bold text-white tracking-widest">${x},${y}</span>
            </div>
            <div class="text-[9px] text-gray-400 text-center mt-0.5">Click to select</div>
        </div>
    `;
}

function clearGridHover() {
    if (cursorTooltip) cursorTooltip.classList.add('hidden');
}

function handleGridClick(e) {
    const b = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - b.left) * (canvas.width / b.width) / cellSize);
    const y = Math.floor((e.clientY - b.top) * (canvas.height / b.height) / cellSize);

    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;

    for (const ad of advertisementsMeta) {
        const r = ad.region;
        if (x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2) {
            let metaHtml;
            if (ad.special) { 
                metaHtml = `<p><strong>Advertiser & Bid Winner:</strong> ${ad.advertiser}</p><p><strong>Zone:</strong> ${ad.zone} Zone</p><p><strong>Other Bidders:</strong> Çamoluk Otomotiv ($16) , RE/MAX ($17)</p><p><strong>Coordinates:</strong> (${r.x1},${r.y1}) to (${r.x2},${r.y2})</p><p><strong>Price Paid:</strong> ${ad.price}</p>`;
            } else { 
                metaHtml = `<p><strong>Advertiser:</strong> ${ad.advertiser}</p><p><strong>Zone:</strong> ${ad.zone}</p><p><strong>Coordinates:</strong> (${r.x1},${r.y1}) to (${r.x2},${r.y2})</p><p><strong>Price Paid:</strong> ${ad.price}</p><p><strong>Message:</strong> ${ad.message || 'Professional advertisement placement.'}</p>`;
            }
            openParcelDetails(document.getElementById(ad.imgId).src, metaHtml);
            return; 
        }
    }

    const zone = getZone(x, y);

    if (zone === 'yellow' || zone === 'orange') {
        alert('⚠️ This zone is reserved for BULK and RENTAL parcels only.\n\nPlease click on the GREEN zone for single parcel purchases.');
        return;
    }

    if (zone === 'pink') {
        openBiddingModal(); 
        return; 
    }

    openPurchaseModal({ x, y });
}


// --- 7. Modallar ---
function toggleDetails() {
    document.getElementById('detailsSection').classList.toggle('hidden');
}

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

function openPurchaseModal(coords) {
    const modal = document.getElementById('purchaseModal');
    const infoEl = document.getElementById('selectedInfo');
    const coordsEl = document.getElementById('parcelCoords');

    if (coords) {
        infoEl.textContent = `You are about to purchase the single parcel at coordinates (X: ${coords.x}, Y: ${coords.y}). Price: $1.00`;
        coordsEl.value = `X: ${coords.x}, Y: ${coords.y}`;
    } else {
        infoEl.textContent = 'Please specify the coordinates you wish to buy in the message box below.';
        coordsEl.value = 'N/A - Manual Request';
    }
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}
function closeModal() { 
    document.getElementById('purchaseModal').classList.add('hidden');
    document.body.classList.remove('modal-open');
}

function buyEarlyBird() {
    triggerEarlyBirdHype();
    document.getElementById('earlyBirdModal').classList.remove('hidden');
    document.body.classList.add('modal-open');
    
    document.body.classList.add('shake-screen');
    setTimeout(() => {
        document.body.classList.remove('shake-screen');
    }, 500);
}
window.buyEarlyBird = buyEarlyBird;

function closeEarlyBirdModal() {
    document.getElementById('earlyBirdModal').classList.add('hidden');
    document.body.classList.remove('modal-open');
}
window.closeEarlyBirdModal = closeEarlyBirdModal;

function proceedToPurchase() {
    const purchaseLink = "https://testingin1day.ikas.shop/adparcel-earlybird";
    window.open(purchaseLink, '_blank');
    closeEarlyBirdModal();
}
window.proceedToPurchase = proceedToPurchase;

function openBiddingModal() {
    document.getElementById('biddingModal').classList.remove('hidden');
    document.body.classList.add('modal-open');
    startBiddingAnimation(); 
}
window.openBiddingModal = openBiddingModal;

function closeBiddingModal() {
    document.getElementById('biddingModal').classList.add('hidden');
    document.body.classList.remove('modal-open');
    if (window.biddingInterval) clearInterval(window.biddingInterval);
    if (window.timerInterval) clearInterval(window.timerInterval);
    if (window.hammerInterval) clearInterval(window.hammerInterval);
    if (window.chatInterval) clearInterval(window.chatInterval);
}
window.closeBiddingModal = closeBiddingModal;

function openPremiumModal() {
    document.getElementById('premiumModal').classList.remove('hidden');
    document.body.classList.add('modal-open');
    startNetworkingAnimation();
}
window.openPremiumModal = openPremiumModal;

function closePremiumModal() {
    document.getElementById('premiumModal').classList.add('hidden');
    document.body.classList.remove('modal-open');
    if (window.networkingInterval) clearInterval(window.networkingInterval);
    if (window.chatInterval) clearInterval(window.chatInterval);
}
window.closePremiumModal = closePremiumModal;


// --- 8. Simülasyonlar ---

function startChatParcelSimulation() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  chatMessages.innerHTML = '';
  
  const realNames = [
      'Alexander K.', 'Sarah Jenkins', 'Mike T.', 'Emma W.', 'David L.', 
      'Lisa Garcia', 'Tom Anderson', 'Anna Smith', 'Chris B.', 'Maria R.', 
      'James Taylor', 'Jennifer D.', 'Robert M.', 'Michelle W.', 'Kevin T.',
      'Daniel Kim', 'Sophia P.', 'Lucas Martin', 'Isabella R.', 'Oliver W.'
  ];
  
  const chatTexts = [
    "Just bought 100 parcels, prices are going up!", 
    "Who keeps outbidding me in the pink zone??", 
    "Early bird deal is a steal, grabbed mine.", 
    "My ad traffic increased by 40% since yesterday.", 
    "STOP BUYING GREEN ZONE! Leave some for me.", 
    "Just saw a huge brand enter the grid...", 
    "Roi on this is better than my crypto portfolio.", 
    "Is the yellow zone open for bulk yet?", 
    "Can't believe I snagged that spot.", 
    "HODL your parcels, resale value is climbing.", 
    "Just planted 50 trees with my purchase 🌳", 
    "Someone just sniped a premium spot right under my nose!", 
    "This chat is moving too fast lol", 
    "AdParcel is the new Bitcoin.", 
    "Waiting for the next batch release...",
    "Anyone else verified their pixel yet?",
    "Support responded in 2 mins, nice.",
    "Designing my banner now, needs to pop."
  ];
  
  realNames.sort(() => 0.5 - Math.random());
  chatTexts.sort(() => 0.5 - Math.random());

  function addChatMessage() {
     const randomPerson = realNames[Math.floor(Math.random() * realNames.length)];
    const randomText = chatTexts[Math.floor(Math.random() * chatTexts.length)];
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start gap-2 py-2 border-b border-gray-700 last:border-b-0 animate-pulse';
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'w-7 h-7 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0';
    avatarDiv.textContent = randomPerson.charAt(0);
    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex-1 min-w-0';
    const nameDiv = document.createElement('div');
    nameDiv.className = 'text-xs font-semibold text-green-400 mb-1';
    nameDiv.textContent = randomPerson;
    const textDiv = document.createElement('div');
    textDiv.className = 'text-xs text-gray-300 break-words';
    textDiv.textContent = randomText;
    contentDiv.appendChild(nameDiv);
    contentDiv.appendChild(textDiv);
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    while (chatMessages.children.length > 12) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
    setTimeout(() => { chatMessages.scrollTop = chatMessages.scrollHeight; }, 50);
  }
  for (let i = 0; i < 8; i++) {
    setTimeout(() => addChatMessage(), i * 140);
  }
  function scheduleNextChat() {
    const delay = 1500 + Math.random() * 2000;
    window.chatParcelInterval = setTimeout(() => {
      addChatMessage();
      scheduleNextChat();
    }, delay);
  }
  scheduleNextChat();
}

function triggerEarlyBirdHype() {
  if (navigator.vibrate) { navigator.vibrate(150); }
  const ticker = document.getElementById('tickerContent');
  if (ticker) {
    ensureHypeStyles();
    ticker.classList.add('fastTicker');
    setTimeout(() => ticker.classList.remove('fastTicker'), 6000);
  }
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed; inset:0; z-index:60; pointer-events:none; background:rgba(255,255,255,0.65); transition:opacity 300ms ease-out;';
  document.body.appendChild(flash);
  requestAnimationFrame(() => { flash.style.opacity = '0'; });
  setTimeout(() => flash.remove(), 350);
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
  `;
  document.head.appendChild(style);
}

function spawnEmojiBurst(count = 50) {
  const emojis = ['🎉','💸','🔥','🚀','✨','🎯', '💰', '💥'];
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span');
    span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const startX = 50; 
    const startY = 50; 
    const spreadX = (Math.random() - 0.5) * 150; 
    const spreadY = (Math.random() - 0.5) * 150; 
    span.style.cssText = `
        position: fixed; left: ${startX}vw; top: ${startY}vh; font-size: ${Math.random() * 24 + 20}px; z-index: 10000; pointer-events: none; transform: translate(-50%, -50%); animation: explosion 1s ease-out forwards;
    `;
    if (!document.getElementById('explosion-style')) {
        const style = document.createElement('style');
        style.id = 'explosion-style';
        style.textContent = ` @keyframes explosion { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(1.5) rotate(720deg); opacity: 0; } } `;
        document.head.appendChild(style);
    }
    span.style.setProperty('--tx', `${spreadX}vw`);
    span.style.setProperty('--ty', `${spreadY}vh`);
    document.body.appendChild(span);
    setTimeout(() => span.remove(), 1000);
  }
}

// Bidding Simulation
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
  
  let currentBid = 127.50, bidCount = 47, participantCount = 23, timeRemaining = 9252;
  const bidIncrement = 0.25;
  let lastBidderName = "";
  
  const realBidders = ['Michael T.', 'Jessica W.', 'Ryan G.', 'Emily Clark', 'David Scott', 'Laura B.', 'Kevin M.', 'Sophia L.', 'Jason P.', 'Robert K.'];
  const msgs = ["Raising!", "It's mine", "Too cheap", "What a steal", "LFG!", "Going up", "Don't push me"];
  
  window.biddingInterval = setInterval(() => { 
      currentBid += bidIncrement; 
      if(counter) counter.textContent = `$${currentBid.toFixed(2)}`; 
      if(nextBid) nextBid.textContent = `$${(currentBid + bidIncrement).toFixed(2)}`; 
      
      let rnd;
      do {
         rnd = realBidders[Math.floor(Math.random() * realBidders.length)];
      } while (rnd === lastBidderName);
      lastBidderName = rnd;

      if(currentBidder) currentBidder.textContent = rnd; 
      
      bidCount += Math.floor(Math.random() * 2); 
      if(totalBids) totalBids.textContent = bidCount;
      
      if(liveUpdates) {
          const div = document.createElement('div');
          div.className = "animate-pulse text-green-300";
          const prevBidder = realBidders[Math.floor(Math.random() * realBidders.length)];
          if (Math.random() > 0.5) {
              div.innerText = `🔥 ${rnd} outbid ${prevBidder}! ($${currentBid.toFixed(2)})`;
          } else {
              div.innerText = `⚡ ${rnd} takes the lead! ($${currentBid.toFixed(2)})`;
          }
          liveUpdates.prepend(div);
          if(liveUpdates.children.length > 5) liveUpdates.removeChild(liveUpdates.lastChild);
      }

  }, 1200); 

  window.timerInterval = setInterval(() => { 
      timeRemaining -= 1; 
      const hours = Math.floor(timeRemaining / 3600); 
      const minutes = Math.floor((timeRemaining % 3600) / 60); 
      const seconds = timeRemaining % 60; 
      if(auctionTimer) auctionTimer.textContent = `${hours}h ${minutes}m ${seconds}s`; 
      if (timeRemaining <= 0) timeRemaining = 9252; 
  }, 1000);
  
  window.chatInterval = setInterval(() => { 
      const liveChat = document.getElementById('liveChat'); 
      if(!liveChat) return;
      const rndUser = realBidders[Math.floor(Math.random() * realBidders.length)];
      const rndMsg = msgs[Math.floor(Math.random() * msgs.length)];
      const div = document.createElement('div');
      div.className = "text-xs text-gray-300";
      div.innerHTML = `<span class="text-blue-400 font-bold">${rndUser}:</span> ${rndMsg}`;
      liveChat.appendChild(div);
      liveChat.scrollTop = liveChat.scrollHeight;
  }, 1000);
}

function startNetworkingAnimation() {
  const connectionCounter = document.getElementById('connectionCounter');
  const collaborationCounter = document.getElementById('collaborationCounter');
  const networkingChat = document.getElementById('networkingChat');

  let connections = 2847, collaborations = 156;
  const professionalNames = ['Oliver Smith', 'Emma Johnson', 'Liam Brown', 'Sophia Davis', 'William Wilson', 'Isabella Miller', 'James Anderson', 'Charlotte Taylor'];
  const netMsgs = ["Looking for B2B partners in SaaS", "Great opportunity, DM me", "Let's connect on LinkedIn", "Proposal sent!", "Checking portfolios now", "Anyone hiring media buyers?"];

  window.networkingInterval = setInterval(() => { 
      connections += Math.floor(Math.random() * 5); 
      collaborations += Math.floor(Math.random() * 2); 
      if(connectionCounter) connectionCounter.textContent = connections.toLocaleString(); 
      if(collaborationCounter) collaborationCounter.textContent = collaborations.toLocaleString(); 
  }, 2000);
  
  window.chatInterval = setInterval(() => { 
      if(!networkingChat) return;
      const rndUser = professionalNames[Math.floor(Math.random() * professionalNames.length)];
      const rndMsg = netMsgs[Math.floor(Math.random() * netMsgs.length)];
      const div = document.createElement('div');
      div.className = "text-xs text-gray-300 py-1";
      div.innerHTML = `<span class="text-purple-400 font-bold">${rndUser}:</span> ${rndMsg}`;
      networkingChat.appendChild(div);
      networkingChat.scrollTop = networkingChat.scrollHeight;
  }, 1500);
}


// --- 8. UI Güncelleme ---
function updateSidebarStats() {
    const SOLD_DISPLAY_OVERRIDE = 274346;
    const AVAILABLE_DISPLAY_OVERRIDE = 1000000 - SOLD_DISPLAY_OVERRIDE;
    const plantedTrees = 820;

    const soldCountEl = document.getElementById('soldCount');
    const availableCountEl = document.getElementById('availableCount');
    const treeCountEl = document.getElementById('treeCount');

    if (soldCountEl) soldCountEl.textContent = SOLD_DISPLAY_OVERRIDE.toLocaleString();
    if (availableCountEl) availableCountEl.textContent = AVAILABLE_DISPLAY_OVERRIDE.toLocaleString();
    if (treeCountEl) treeCountEl.textContent = plantedTrees.toLocaleString();
}

const headlines = [
    '<span class="font-bold text-lg animate-text-shimmer">🎁 DON\'T MISS SURPRISE GIFTS! (MacBook, AirPods, Scooters hidden under pixels!) 🎁</span>',
    '🟢 Green zone prices rising – FOMO kicking in!', '🌳 Over 2,000 trees planted this week – thank you!', '💗 Bidding war in pink zone: $75 and counting!',
    '🚀 Parcel #274,346 just sold. Quarter milestone crushed!', '🎨 New ad banner in orange zone just dropped!', '💬 Chat-Parcel feature launching soon!',
    '📈 AdParcel trending on TechCrunch!', '🔥 Only 10 premium parcels left in row 998!', '🏆 Top bidder of the day: user "PixMaster99"',
    '🧩 8 hidden parcels contain prizes 👀', '🌎 Rent your ad space for just 5¢ per day!', '💸 Passive income on digital land? Yes please.',
    '🎁 New bonus drops every 100k sold parcels!', '🔒 You now own part of the internet. Literally.', '📢 Green area nearly sold out! Act fast.',
];

function updateTicker() {
    document.getElementById('tickerContent').innerHTML = headlines.join(' &nbsp;&nbsp;|&nbsp;&nbsp; ');
}

setInterval(() => {
    headlines.push(headlines.shift());
    updateTicker();
}, 20000);


// --- FORM GÖNDERİM (AJAX) ---
const purchaseForm = document.getElementById('purchaseForm');
const purchaseContent = document.getElementById('purchaseContent');
const successMessage = document.getElementById('successMessage');
const submitBtn = document.getElementById('submitBtn');

if (purchaseForm) {
    purchaseForm.addEventListener('submit', function(e) {
        e.preventDefault(); 
        const formData = new FormData(purchaseForm);
        const object = Object.fromEntries(formData);
        const json = JSON.stringify(object);
        
        if(submitBtn) {
             submitBtn.innerHTML = "SENDING...";
             submitBtn.disabled = true;
             submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: json
        })
        .then(async (response) => {
            if (response.status == 200) {
                purchaseContent.classList.add('hidden');
                successMessage.classList.remove('hidden');
            } else {
                alert("Something went wrong. Please try again.");
                if(submitBtn) {
                    submitBtn.innerHTML = "ACTIVATE PARCEL";
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        })
        .catch(error => {
            console.log(error);
            alert("An error occurred.");
            if(submitBtn) {
                submitBtn.innerHTML = "ACTIVATE PARCEL";
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });
    });
}

function resetModalState() {
    if(purchaseContent && successMessage) {
        purchaseContent.classList.remove('hidden');
        successMessage.classList.add('hidden');
        purchaseForm.reset();
        if(submitBtn) {
            submitBtn.innerHTML = "ACTIVATE PARCEL";
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

window.closeModal = function() {
    document.getElementById('purchaseModal').classList.add('hidden');
    document.body.classList.remove('modal-open');
    setTimeout(resetModalState, 500);
}
