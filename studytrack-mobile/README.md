# StudyTrack Mobil 📚

StudyTrack web uygulamasının React Native + Expo ile geliştirilmiş mobil versiyonu.

## Klasör Yapısı

```
studytrack-mobile/
├── App.js                          # Giriş noktası
├── app.json                        # Expo konfigürasyonu
├── package.json                    # Bağımlılıklar
├── babel.config.js                 # Babel ayarları
├── assets/                         # Uygulama ikonları ve görseller
└── src/
    ├── api/
    │   └── axios.js                # Axios istemcisi + interceptors
    ├── components/
    │   ├── StatCard.js             # İstatistik kartı bileşeni
    │   ├── StyledButton.js         # Yeniden kullanılabilir buton
    │   └── StyledInput.js          # Yeniden kullanılabilir input
    ├── constants/
    │   ├── colors.js               # Renk paleti (web uygulamasıyla uyumlu)
    │   └── index.js                # Sabitler (API URL, mesajlar vb.)
    ├── context/
    │   └── AuthContext.js          # Oturum yönetimi (AsyncStorage)
    ├── navigation/
    │   └── AppNavigator.js         # Auth stack + Tab navigator
    └── screens/
        ├── LoginScreen.js          # Giriş ekranı
        ├── RegisterScreen.js       # Kayıt ekranı
        ├── DashboardScreen.js      # Ana panel
        ├── TasksScreen.js          # Görev listesi
        └── ProfileScreen.js        # Profil ekranı
```

## Kurulum

```bash
cd studytrack-mobile
npm install
npx expo start
```

Ardından:
- **Android emülatörde çalıştır:** `a` tuşuna bas
- **iOS simülatörde çalıştır:** `i` tuşuna bas (macOS gerekli)
- **Expo Go ile telefonda:** QR kodu tara

## Teknolojiler

| Paket | Versiyon | Açıklama |
|-------|----------|----------|
| expo | ~52.0.46 | Expo SDK |
| react-native | 0.76.9 | Temel framework |
| @react-navigation/native | ^6.1 | Navigation container |
| @react-navigation/native-stack | ^6.11 | Stack navigatör |
| @react-navigation/bottom-tabs | ^6.6 | Tab navigatör |
| react-native-screens | ~4.4 | Native ekran optimizasyonu |
| react-native-safe-area-context | 4.12 | Safe area desteği |
| @react-native-async-storage/async-storage | 1.23 | Token saklama |
| axios | ^1.7 | HTTP istemcisi |

## Mevcut Durum (Faz 1)

- ✅ Navigation sistemi (Auth Stack + Bottom Tabs)
- ✅ Login ekranı (API bağlantısı hazır)
- ✅ Register ekranı (API bağlantısı hazır)
- ✅ Dashboard ekranı (mock data)
- ✅ Tasks ekranı (mock data)
- ✅ Profile ekranı (mock data)
- ✅ AuthContext (AsyncStorage token yönetimi)
- ✅ Axios istemcisi (interceptor ile token ekleme)

## Sonraki Adımlar (Faz 2)

- [ ] Dashboard'a gerçek API bağlantısı
- [ ] Tasks CRUD işlemleri
- [ ] Görev / Plan / Hedef ekleme modal'ları
- [ ] Pull-to-refresh gerçek API ile
- [ ] Profil düzenleme
