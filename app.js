/**
 * Galactic Cockpit - Star Wars: Unlimited Companion App
 * Logique de jeu : Gestion des dégâts cumulés, chronomètre officiel et tirage d'initiative.
 */

// --- ÉTAT GLOBAL DU MATCH ---
let player1Damage = 0;
let player2Damage = 0;

let player1Wins = 0;
let player2Wins = 0;

// Caps de PV de base officiels rangés par ordre croissant
const baseCapPresets = [24, 25, 28, 30, 33, 35];
// On démarre par défaut sur la base standard à 30 PV (index 3)
let p1BaseIndex = 3;
let p2BaseIndex = 3;

let isTransitioningRound = false;
let isSoloModeActive = false;

// --- GESTION DU CHRONOMÈTRE ---
let remainingSeconds = 55 * 60; // Défaut BO3 : 55 min
let isTimerRunning = false;
let timerInterval = null;

// Aspects officiels de Star Wars: Unlimited
const aspects = [
  { name: 'Vigilance', hex: '#38bdf8', core: '#bae6fd', bg: '#04101a' },      // Bleu
  { name: 'Commandement', hex: '#34d399', core: '#a7f3d0', bg: '#04140d' },  // Vert
  { name: 'Agressivité', hex: '#ef4444', core: '#fecaca', bg: '#180507' },    // Rouge
  { name: 'Ruse', hex: '#fbbf24', core: '#fde68a', bg: '#171305' },           // Jaune
  { name: 'Héroïsme', hex: '#94a3b8', core: '#f1f5f9', bg: '#11151c' },       // Blanc
  { name: 'Infamie', hex: '#a855f7', core: '#e9d5ff', bg: '#0d0718' }         // Noir
];
let p1AspectIndex = 0; // Vigilance (Bleu)
let p2AspectIndex = 2; // Agressivité (Rouge)

// --- GESTION DU RETOUR HAPTIQUE ---
function triggerVibration(pattern = 15) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

// --- LOGIQUE DES DÉGÂTS & MANCHES ---

/**
 * Ajuste les dégâts subis par un joueur.
 * En SWU officiel, les dégâts débutent à 0 et s'accumulent jusqu'au cap de la base.
 */
function adjustDamage(player, amount) {
  if (isTransitioningRound) return;
  triggerVibration(12);

  if (player === 'p1') {
    player1Damage = Math.max(0, player1Damage + amount);
    document.getElementById('dmg-p1').textContent = player1Damage;
    checkBaseDestruction('p1');
  } else {
    player2Damage = Math.max(0, player2Damage + amount);
    document.getElementById('dmg-p2').textContent = player2Damage;
    checkBaseDestruction('p2');
  }
}

/**
 * Vérifie si la base d'un joueur a encaissé des dégâts létaux.
 */
function checkBaseDestruction(targetPlayer) {
  const p1Max = baseCapPresets[p1BaseIndex];
  const p2Max = baseCapPresets[p2BaseIndex];

  if (targetPlayer === 'p1' && player1Damage >= p1Max) {
    triggerRoundLoss('p1');
  } else if (targetPlayer === 'p2' && player2Damage >= p2Max) {
    triggerRoundLoss('p2');
  }
}

/**
 * Valide la défaite d'un joueur, crédite la victoire à l'adversaire et remet le plateau à zéro.
 */
function triggerRoundLoss(loser) {
  isTransitioningRound = true;
  triggerVibration([100, 50, 100, 50, 200]);

  if (loser === 'p1') {
    player2Wins++;
  } else {
    player1Wins++;
  }

  updateScoreboardUI();

  // Temporisation visuelle avant de reset les compteurs de dégâts
  setTimeout(() => {
    player1Damage = 0;
    player2Damage = 0;
    document.getElementById('dmg-p1').textContent = '0';
    document.getElementById('dmg-p2').textContent = '0';
    isTransitioningRound = false;
  }, 1200);
}

function updateScoreboardUI() {
  document.getElementById('record-p1').textContent = `V: ${player1Wins} | D: ${player2Wins}`;
  document.getElementById('record-p2').textContent = `V: ${player2Wins} | D: ${player1Wins}`;
}

function cyclePlayerWins(player) {
  triggerVibration(20);
  if (player === 'p1') {
    player1Wins = (player1Wins + 1) % 4;
  } else {
    player2Wins = (player2Wins + 1) % 4;
  }
  updateScoreboardUI();
}

function resetFullMatch() {
  player1Wins = 0;
  player2Wins = 0;
  player1Damage = 0;
  player2Damage = 0;
  document.getElementById('dmg-p1').textContent = '0';
  document.getElementById('dmg-p2').textContent = '0';
  updateScoreboardUI();
  openDrawer(false);
}

/**
 * Fait défiler les PV maximums de base (30, 28, 25, 33, 35, 24).
 */
function cycleBaseCap(player) {
  triggerVibration([20, 30]);
  if (player === 'p1') {
    p1BaseIndex = (p1BaseIndex + 1) % baseCapPresets.length;
    const maxVal = baseCapPresets[p1BaseIndex];
    document.getElementById('base-cap-p1').innerHTML = `🛡️ MAX: ${maxVal} ↺`;
    checkBaseDestruction('p1');
  } else {
    p2BaseIndex = (p2BaseIndex + 1) % baseCapPresets.length;
    const maxVal = baseCapPresets[p2BaseIndex];
    document.getElementById('base-cap-p2').innerHTML = `🛡️ MAX: ${maxVal} ↺`;
    checkBaseDestruction('p2');
  }
}

// --- THÈMES & INITIATIVE ---

function cycleAspect(player) {
  triggerVibration(15);
  if (player === 'p1') {
    p1AspectIndex = (p1AspectIndex + 1) % aspects.length;
    const current = aspects[p1AspectIndex];
    document.documentElement.style.setProperty('--p1-color', current.hex);
    document.documentElement.style.setProperty('--p1-core', current.core);
    document.documentElement.style.setProperty('--p1-shadow', current.hex + '99');
    document.documentElement.style.setProperty('--p1-bg', current.bg);
    document.getElementById('aspect-name-p1').textContent = current.name;
  } else {
    p2AspectIndex = (p2AspectIndex + 1) % aspects.length;
    const current = aspects[p2AspectIndex];
    document.documentElement.style.setProperty('--p2-color', current.hex);
    document.documentElement.style.setProperty('--p2-core', current.core);
    document.documentElement.style.setProperty('--p2-shadow', current.hex + '99');
    document.documentElement.style.setProperty('--p2-bg', current.bg);
    document.getElementById('aspect-name-p2').textContent = current.name;
  }
}

function toggleInitiative(targetPlayer) {
  triggerVibration([25, 50, 25]);
  document.getElementById('zone-p1').classList.toggle('active', targetPlayer === 'p1');
  document.getElementById('zone-p2').classList.toggle('active', targetPlayer === 'p2');
}

// --- CHRONOMÈTRE DE TOURNOI ---

function updateTimerDisplays() {
  const mins = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
  const secs = (remainingSeconds % 60).toString().padStart(2, '0');
  const formattedTime = `${mins}:${secs}`;

  document.querySelectorAll('.timer-val').forEach(el => el.textContent = formattedTime);

  const isWarningZone = remainingSeconds <= 300 && remainingSeconds > 0;
  document.getElementById('timer-p1').classList.toggle('timer-warning', isWarningZone);
  document.getElementById('timer-p2').classList.toggle('timer-warning', isWarningZone);
}

function toggleTimer() {
  triggerVibration(18);
  const btn = document.getElementById('timer-toggle');

  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    btn.textContent = '▶ START';
    btn.style.color = '#34d399';
  } else {
    isTimerRunning = true;
    btn.textContent = '⏸ PAUSE';
    btn.style.color = '#fbbf24';

    timerInterval = setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        updateTimerDisplays();
        if (remainingSeconds === 300) triggerVibration([80, 100, 80]); // Alerte 5 min restantes
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        btn.textContent = '▶ START';
        btn.style.color = '#34d399';
        
        document.getElementById('time-up-flash').classList.add('active');
        triggerVibration([200, 100, 200, 100, 400]);
        setTimeout(() => document.getElementById('time-up-flash').classList.remove('active'), 6000);
      }
    }, 1000);
  }
}

function setTimerMinutes(minutes, roundLabel) {
  clearInterval(timerInterval);
  isTimerRunning = false;
  remainingSeconds = minutes * 60;
  document.getElementById('timer-toggle').textContent = '▶ START';
  document.getElementById('timer-toggle').style.color = '#34d399';
  document.getElementById('round-format-txt').textContent = roundLabel;
  document.getElementById('time-up-flash').classList.remove('active');
  updateTimerDisplays();
  openDrawer(false);
}

function applyCustomTimer() {
  const value = parseInt(document.getElementById('input-custom-mins').value, 10);
  if (value && value > 0) {
    setTimerMinutes(value, `CUSTOM • ${value} MIN`);
  }
}

// --- INTERFACE, TIROIR & MODALES ---

function openDrawer(isOpen) {
  triggerVibration(10);
  document.getElementById('drawer').classList.toggle('open', isOpen);
  document.getElementById('backdrop').classList.toggle('open', isOpen);
}

function toggleFullscreen() {
  triggerVibration(20);
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
  openDrawer(false);
}

function toggleSoloMode() {
  triggerVibration([30, 30]);
  isSoloModeActive = !isSoloModeActive;
  document.body.classList.toggle('solo-mode', isSoloModeActive);
  document.getElementById('btn-solo').textContent = isSoloModeActive ? '👥 Mode Duel (2 Joueurs)' : '📱 Mode Solo (1 Joueur)';
  openDrawer(false);
}

// --- LANCEMENT DE JETON (PILE OU FACE) ---
let isCoinFlipping = false;

function openCoinModal() {
  triggerVibration(15);
  openDrawer(false);
  document.getElementById('modal-coin').classList.add('open');
  
  const statusEl = document.getElementById('coin-status');
  statusEl.textContent = 'Tapez sur la pièce pour lancer';
  statusEl.style.color = '#64748b';

  const coin = document.getElementById('coin-asset');
  coin.style.transition = 'none';
  coin.style.transform = 'rotateY(0deg)';
}

function closeCoinModal() {
  document.getElementById('modal-coin').classList.remove('open');
}

function flipInitiativeCoin() {
  if (isCoinFlipping) return;
  isCoinFlipping = true;
  triggerVibration([20, 50]);

  const coin = document.getElementById('coin-asset');
  const statusEl = document.getElementById('coin-status');
  statusEl.textContent = 'Détermination du sort...';
  statusEl.style.color = '#fbbf24';

  const baseRotations = 10 + Math.floor(Math.random() * 5);
  const isForceSide = Math.random() < 0.5;
  const targetDegree = isForceSide ? (baseRotations * 360) : (baseRotations * 360 + 180);

  coin.style.transition = 'transform 2.5s cubic-bezier(0.1, 0.9, 0.2, 1)';
  coin.style.transform = `rotateY(${targetDegree}deg)`;

  setTimeout(() => {
    isCoinFlipping = false;
    if (isForceSide) {
      triggerVibration([30, 50, 30]);
      statusEl.textContent = 'HÉROÏSME (REBELLE)';
      statusEl.style.color = 'var(--force-color)';
    } else {
      triggerVibration([60, 100, 60]);
      statusEl.textContent = 'INFAMIE (EMPIRE)';
      statusEl.style.color = 'var(--obscur-color)';
    }
  }, 2500);
}

// --- GESTION DE LA PWA & WAKE LOCK ---
let deferredPromptInstance;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPromptInstance = e;
  document.getElementById('btn-install-app').style.display = 'block';
});

function triggerPwaInstall() {
  if (deferredPromptInstance) {
    deferredPromptInstance.prompt();
    deferredPromptInstance.userChoice.then(() => {
      deferredPromptInstance = null;
      document.getElementById('btn-install-app').style.display = 'none';
    });
  }
}

// Maintien de l'écran allumé pendant les parties
document.addEventListener('click', async () => {
  try {
    if ('wakeLock' in navigator) {
      await navigator.wakeLock.request('screen');
    }
  } catch (err) {}
}, { once: true });

// Enregistrement du Service Worker avec rechargement automatique à la mise à jour
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    // Vérifie s'il y a une nouvelle version sur le serveur
    reg.onupdatefound = () => {
      const newWorker = reg.installing;
      newWorker.onstatechange = () => {
        // Dès que la nouvelle version est prête, on recharge la page discrètement
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          window.location.reload();
        }
      };
    };
  }).catch(() => {});
}