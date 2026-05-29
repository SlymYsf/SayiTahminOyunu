// Global değişkenler
let targetDigitCount = 0;
let playerSecretNumber = "";

// 1. Oyunu Başlatma ve Basamak Kontrolü
function startGame() {
    const digitCountInput = document.getElementById('digit-count').value;
    const secretNumberInput = document.getElementById('secret-number').value;

    targetDigitCount = parseInt(digitCountInput);

    // Gizli sayının basamak uzunluğunu kontrol ediyoruz
    if (secretNumberInput.length !== targetDigitCount) {
        alert("Basamak aşımı yaptınız!");
        return; // Hata varsa fonksiyonu burada durdur ve sonraki ekrana geçme
    }

    // Doğrulamadan geçerse sayıyı kaydedip oyun ekranına geçiyoruz
    playerSecretNumber = secretNumberInput;
    
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
}

// 2. Tahmin Yapma ve Basamak Kontrolü
function makeGuess() {
    const guessInput = document.getElementById('guess-input').value;

    // Tahmin edilen sayının basamak uzunluğunu da kontrol ediyoruz
    if (guessInput.length !== targetDigitCount) {
        alert("Basamak aşımı yaptınız! Lütfen " + targetDigitCount + " basamaklı bir sayı girin.");
        return;
    }

    // Skoru hesapla (Bir önceki yanıttaki hesaplama fonksiyonunu çağırıyoruz)
    const resultScore = calculateScore(playerSecretNumber, guessInput);

    // Sonucu ekrana yazdır
    const historyList = document.getElementById('history-list');
    const newHistoryItem = document.createElement('div');
    newHistoryItem.className = 'history-item';
    
    // Tahmin ve yanına + / - skorunu ekliyoruz
    newHistoryItem.innerHTML = `<span>Tahmin: <strong>${guessInput}</strong></span> <span>Skor: <strong>${resultScore}</strong></span>`;
    
    historyList.appendChild(newHistoryItem);

    // Tahmin kutusunu temizle
    document.getElementById('guess-input').value = "";
}

// 3. Skor Hesaplama Algoritması (Önceki ile aynı)
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