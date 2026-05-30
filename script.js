// Firebase kütüphanelerini CDN üzerinden modül olarak içe aktarıyoruz
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Senin Firebase Konfigürasyonun
const firebaseConfig = {
    apiKey: "AIzaSyBkcwXi9nWy4ZtoQ-rV43tilAydOcZvtQI",
    authDomain: "sayitahminoyunu-9be1c.firebaseapp.com",
    databaseURL: "https://sayitahminoyunu-9be1c-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "sayitahminoyunu-9be1c",
    storageBucket: "sayitahminoyunu-9be1c.firebasestorage.app",
    messagingSenderId: "321648931256",
    appId: "1:321648931256:web:e6cb7588ee467b4b7e9f4d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Oyun Değişkenleri
let myPlayerRole = ""; 
let currentRoomId = "";
let targetDigitCount = 0;
let mySecretNumber = "";
let opponentSecretNumber = "";

// DOM Elementleri
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const statusText = document.getElementById('game-status');
const guessInput = document.getElementById('guess-input');
const btnMakeGuess = document.getElementById('btn-make-guess');
const guessesContainer = document.getElementById('guesses-container');
const btnPlayAgain = document.getElementById('btn-play-again'); // YENİ: Tekrar oyna butonu

const digitCountInput = document.getElementById('lobby-digit-count');
const secretCreateInput = document.getElementById('lobby-secret-create');
const secretJoinInput = document.getElementById('lobby-secret-join');
const roomCodeCreateInput = document.getElementById('lobby-room-code-create');

// --- KULLANICI DENEYİMİ İYİLEŞTİRMELERİ ---

digitCountInput.addEventListener('input', () => {
    let maxDigits = parseInt(digitCountInput.value);
    if (!isNaN(maxDigits) && maxDigits >= 3) {
        secretCreateInput.setAttribute('maxlength', maxDigits);
        if (secretCreateInput.value.length > maxDigits) {
            secretCreateInput.value = secretCreateInput.value.slice(0, maxDigits);
        }
    }
});

secretCreateInput.addEventListener('input', function() { this.value = this.value.replace(/[^0-9]/g, ''); });
secretJoinInput.addEventListener('input', function() { this.value = this.value.replace(/[^0-9]/g, ''); });
guessInput.addEventListener('input', function() { this.value = this.value.replace(/[^0-9]/g, ''); });

// --- ODA KURMA İŞLEMİ ---
document.getElementById('btn-create-room').addEventListener('click', async () => {
    const digits = digitCountInput.value;
    const secret = secretCreateInput.value;
    const customCode = roomCodeCreateInput.value.trim(); 
    
    if(!customCode) { alert("Lütfen bir oda kodu belirleyin!"); return; }
    if(secret.length !== parseInt(digits)) { alert(`Gizli sayınız tam olarak ${digits} basamaklı olmalıdır!`); return; }
    if (!hasUniqueDigits(secret)) { alert("Gizli sayınızın tüm rakamları birbirinden farklı olmalıdır!"); return; }

    const roomRefCheck = ref(db, 'rooms/' + customCode);
    const snapshot = await get(roomRefCheck);
    
    if (snapshot.exists() && snapshot.val().status === "playing") {
        const forceOverwrite = confirm("Bu oda kodu şu an kullanımda (oyun devam ediyor). Üzerine yazıp odayı SIFIRLAMAK ister misiniz?");
        if (!forceOverwrite) {
            return;
        }
    }

    mySecretNumber = secret;
    targetDigitCount = parseInt(digits);
    myPlayerRole = "p1";
    currentRoomId = customCode; 

    await set(ref(db, 'rooms/' + currentRoomId), {
        digitCount: targetDigitCount,
        status: "waiting",
        turn: "p1", 
        p1: { secret: mySecretNumber, guesses: [] }
    });

    switchToGameScreen(`Oda Kodunuz: ${currentRoomId}`);
    listenToRoomChanges();
});

// --- ODAYA KATILMA İŞLEMİ ---
document.getElementById('btn-join-room').addEventListener('click', async () => {
    const roomCode = document.getElementById('lobby-room-code').value;
    const secret = secretJoinInput.value;

    if(!roomCode || !secret) { alert("Lütfen oda kodunu ve gizli sayınızı girin."); return; }

    const roomRef = ref(db, 'rooms/' + roomCode);
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
        const roomData = snapshot.val();
        
        if (roomData.status === "waiting") {
            if (secret.length !== roomData.digitCount) { alert(`Sayınız tam olarak ${roomData.digitCount} basamaklı olmalıdır!`); return; }
            if (!hasUniqueDigits(secret)) { alert("Gizli sayınızın tüm rakamları birbirinden farklı olmalıdır!"); return; }

            mySecretNumber = secret;
            targetDigitCount = roomData.digitCount;
            myPlayerRole = "p2";
            currentRoomId = roomCode;

            await update(roomRef, {
                status: "playing",
                p2: { secret: mySecretNumber, guesses: [] }
            });

            switchToGameScreen(`Bağlanılan Oda: ${currentRoomId}`);
            listenToRoomChanges();
        } else {
            alert("Bu oda şu an dolu veya oyun çoktan bitmiş.");
        }
    } else {
        alert("Böyle bir oda bulunamadı!");
    }
});

// --- OYUN İÇİ TAHMİN YAPMA ---
btnMakeGuess.addEventListener('click', async () => {
    const guess = guessInput.value;

    if (guess.length !== targetDigitCount) { alert(`Tahmininiz ${targetDigitCount} basamaklı olmalıdır!`); return; }
    if (!hasUniqueDigits(guess)) { alert("Tahmininizin tüm rakamları birbirinden farklı olmalıdır!"); return; }

    const resultScore = calculateScore(opponentSecretNumber, guess);

    const roomRef = ref(db, 'rooms/' + currentRoomId);
    const snapshot = await get(roomRef);
    const roomData = snapshot.val();
    
    let myGuesses = roomData[myPlayerRole].guesses || [];
    myGuesses.push({ guess: guess, score: resultScore });

    let isWin = (resultScore === `+${targetDigitCount}`);
    let newStatus = roomData.status;
    let newTurn = (myPlayerRole === "p1") ? "p2" : "p1";

    // OYUN DURUMU (STATUS) MANTIĞI
    if (myPlayerRole === "p1") {
        if (isWin) {
            newStatus = "last_chance"; 
            newTurn = "p2";
        } else {
            newTurn = "p2";
        }
    } else if (myPlayerRole === "p2") {
        if (roomData.status === "last_chance") {
            if (isWin) {
                newStatus = "draw"; 
            } else {
                newStatus = "p1_won"; 
            }
        } else {
            if (isWin) {
                newStatus = "p2_won";
            } else {
                newTurn = "p1";
            }
        }
    }

    const updates = {};
    updates[`${myPlayerRole}/guesses`] = myGuesses;
    updates['status'] = newStatus;
    
    if (newStatus === "playing" || newStatus === "last_chance") {
        updates['turn'] = newTurn;
    }

    await update(roomRef, updates);
    guessInput.value = "";
});

// --- VERİTABANI DİNLEME (REALTIME) ---
function listenToRoomChanges() {
    const roomRef = ref(db, 'rooms/' + currentRoomId);
    
    onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        if (myPlayerRole === "p1" && data.p2) opponentSecretNumber = data.p2.secret;
        if (myPlayerRole === "p2" && data.p1) opponentSecretNumber = data.p1.secret;

        if (data.status === "waiting") {
            statusText.innerText = "2. Oyuncu bekleniyor...";
            btnMakeGuess.disabled = true;
        } else if (data.status === "playing") {
            if (data.turn === myPlayerRole) {
                statusText.innerText = "Sıra Sende!";
                statusText.style.color = "#28a745";
                btnMakeGuess.disabled = false;
            } else {
                statusText.innerText = "Rakibin tahmini bekleniyor...";
                statusText.style.color = "#d9534f";
                btnMakeGuess.disabled = true;
            }
        } else if (data.status === "last_chance") {
            if (myPlayerRole === "p2") {
                statusText.innerText = "DİKKAT! Rakibin sayını buldu.\nBeraberlik için SON HAKKIN!";
                statusText.style.color = "#ff8c00"; 
                btnMakeGuess.disabled = false;
            } else {
                statusText.innerText = "Tebrikler sayıyı buldun!\nRakibinin beraberlik için son hakkı bekleniyor...";
                statusText.style.color = "#ff8c00";
                btnMakeGuess.disabled = true;
            }
        } else if (data.status === "p1_won") {
            statusText.innerText = "🎉 OYUNCU 1 KAZANDI! 🎉";
            statusText.style.color = "#28a745";
            endGame(data);
        } else if (data.status === "p2_won") {
            statusText.innerText = "🎉 OYUNCU 2 KAZANDI! 🎉";
            statusText.style.color = "#28a745";
            endGame(data);
        } else if (data.status === "draw") {
            statusText.innerText = "🤝 OYUN BERABERE BİTTİ! 🤝\nİki oyuncu da aynı turda sayıyı buldu.";
            statusText.style.color = "#007bff";
            endGame(data);
        }

        guessesContainer.innerHTML = "";
        let p1Guesses = data.p1.guesses || [];
        let p2Guesses = (data.p2 && data.p2.guesses) ? data.p2.guesses : [];
        let maxTurns = Math.max(p1Guesses.length, p2Guesses.length);
        
        for (let i = 0; i < maxTurns; i++) {
            if (p1Guesses[i]) appendGuessToHistory("Oyuncu 1", p1Guesses[i].guess, p1Guesses[i].score, "p1");
            if (p2Guesses[i]) appendGuessToHistory("Oyuncu 2", p2Guesses[i].guess, p2Guesses[i].score, "p2");
        }
    });
}

// --- YARDIMCI FONKSİYONLAR ---
function switchToGameScreen(roomInfoText) {
    lobbyScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    document.getElementById('room-info').innerText = roomInfoText;
    document.getElementById('my-secret-display').innerText = `Gizli Sayınız: ${mySecretNumber}`;
    guessInput.setAttribute('maxlength', targetDigitCount);
}

function appendGuessToHistory(player, guess, score, playerId) {
    const div = document.createElement('div');
    div.className = 'history-item';
    
    if (playerId === "p1") {
        div.classList.add("guess-p1");
        div.innerHTML = `<span>${player}: <strong>${guess}</strong></span> <span>Skor: <strong>${score}</strong></span>`;
    } else {
        div.classList.add("guess-p2");
        div.innerHTML = `<span>Skor: <strong>${score}</strong></span> <span><strong>${guess}</strong> :${player}</span>`;
    }
    
    if (score === `+${targetDigitCount}`) {
        div.style.backgroundColor = "#d4edda";
        div.style.border = "2px solid #28a745";
    }

    guessesContainer.appendChild(div);
}

// Oyun bittiğinde çalışan fonksiyon (Tekrar oyna butonunu görünür yapar)
function endGame(data) {
    btnMakeGuess.disabled = true;
    guessInput.disabled = true;
    btnPlayAgain.style.display = 'block';
}

function calculateScore(secretNumber, guessNumber) {
    let plus = 0;
    let minus = 0;
    let secretArr = String(secretNumber).split('');
    let guessArr = String(guessNumber).split('');

    for (let i = 0; i < secretArr.length; i++) {
        if (secretArr[i] === guessArr[i]) {
            plus++;
            secretArr[i] = null; 
            guessArr[i] = null;
        }
    }

    for (let i = 0; i < guessArr.length; i++) {
        if (guessArr[i] !== null) {
            let matchIndex = secretArr.indexOf(guessArr[i]);
            if (matchIndex !== -1) {
                minus++;
                secretArr[matchIndex] = null; 
            }
        }
    }

    let result = "";
    if (plus > 0) result += `+${plus} `;
    if (minus > 0) result += `-${minus}`;
    
    return result.trim() === "" ? "0" : result.trim();
}

function hasUniqueDigits(numberStr) {
    return new Set(numberStr).size === numberStr.length;
}