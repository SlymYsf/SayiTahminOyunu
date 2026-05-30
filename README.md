# 🎯 Sayı Tahmin Savaşı (Multiplayer Logic Game)

**Sayı Tahmin Savaşı**, iki oyuncunun mantık yürüterek birbirlerinin gizli sayılarını bulmaya çalıştığı ("Bulls and Cows" veya "Mastermind" olarak da bilinen) gerçek zamanlı bir web oyunudur.

👉 **[Oyunu Hemen Oyna!](https://slymysf.github.io/SayiTahminOyunu/)**

## 🚀 Özellikler

* **Gerçek Zamanlı Multiplayer:** Firebase Realtime Database sayesinde iki farklı cihazdaki oyuncu eşzamanlı olarak oynayabilir.
* **Lobi Sistemi:** Oyuncular benzersiz bir "Oda Kodu" üreterek eşleşirler.
* **Dinamik Basamak Sayısı:** Oyun kurulurken 3 veya daha fazla basamaklı zorluk seviyeleri belirlenebilir.
* **Güvenli Girdi (Validation):** Basamak aşımı engelleme, sadece rakam girişi ve "farklı rakamlar" kuralı sistemsel olarak denetlenir.
* **Tam Responsive:** Hem bilgisayar hem de mobil tarayıcılarda kusursuz görünüm.

## 🛠️ Kullanılan Teknolojiler

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES Modules)
* **Backend / Veritabanı:** Firebase Realtime Database
* **Hosting:** GitHub Pages

## 📖 Nasıl Oynanır?

1. Bir oyuncu **"Oda Kur"** diyerek oyunun basamak sayısını ve kendi gizli sayısını (rakamları farklı olacak şekilde) belirler.
2. Sistem 4 haneli bir **Oda Kodu** üretir.
3. Diğer oyuncu bu oda koduyla ve kendi gizli sayısıyla **"Odaya Katıl"** diyerek eşleşir.
4. Sırayla tahminler yapılır. Sistem her tahmine bir skor verir:
   * **+ (Artı):** Doğru rakam, DOĞRU yer.
   * **- (Eksi):** Doğru rakam, YANLIŞ yer.
5. Örneğin; gizli sayı **1097** ise ve **4207** tahmini yapılırsa sistem **+1 -1** sonucunu verir (7 tam doğru, 0 yeri yanlış).
6. Hedef basamak sayısına (örneğin 4 basamaklı oyun için +4 skoruna) ilk ulaşan kazanır!

## 💻 Kurulum (Geliştiriciler İçin)

Projeyi kendi bilgisayarınızda çalıştırmak isterseniz:
1. Bu depoyu klonlayın: `git clone https://github.com/SlymYsf/SayiTahminOyunu.git`
2. `index.html` dosyasını herhangi bir modern tarayıcıda açın.
3. Kendi Firebase veritabanınızı bağlamak için `game.js` içerisindeki `firebaseConfig` ayarlarını kendi projenize göre güncelleyin.