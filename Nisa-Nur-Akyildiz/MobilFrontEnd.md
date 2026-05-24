# StudyTrack Mobil Frontend - Teknik Özet

## Geliştirici

**Nisa Nur Akyıldız** — Mobil Frontend (React Native + Expo)

---

# StudyTrack Mobil Frontend Teknik Mimari ve Özellik Listesi

## 1. Tasarım Sistemi ve Görsel Kimlik

- **Tema Motifi:** Pastel-soft renk paleti; `#e91e8c` (pembe birincil), `#7b1fa2` (mor ikincil) eksenleri
- **Çok Tema Desteği:** Pembe, Mor, Mavi ve Yeşil olmak üzere 4 farklı renk teması; uygulama genelinde anlık geçiş
- **Emoji Tabanlı Görsel Dil:** Başlık, kart ve rozet öğelerinde fonksiyonel emoji kullanımı; native görüntü yükü olmadan zengin görünüm
- **Tipografi:** Sistem fontu + büyük başlık hiyerarşisi; `fontWeight: '700'` vurguları
- **Kart Tasarımı:** Yuvarlak köşeler (`borderRadius: 28`), hafif `shadowColor` gölgeler, yarı saydam `rgba` yüzeyler
- **Dekoratif Arka Planlar:** Login ekranında `position: 'absolute'` emoji öğeleri ile düşük opaklıklı animatif arka plan
- **Bileşen Kütüphanesi:** `StyledInput`, `StyledButton` — temadan renk alan, `useTheme()` hook'una bağlı yeniden kullanılabilir bileşenler

---

## 2. State Management (Durum Yönetimi)

- **AuthContext:** Merkezi kimlik doğrulama durumu; `token`, `user`, `login`, `logout`, `updateUser` fonksiyonları; AsyncStorage ile oturum kalıcılığı
- **ThemeContext:** 4 tema objesini (`pink`, `purple`, `blue`, `green`) tutan global context; `themeKey`, `theme`, `setTheme`, `THEMES_LIST` API'si; AsyncStorage'a `@studytrack_theme` anahtarıyla kalıcı kayıt
- **Local State:** Her ekranda ayrı `useState` ile form, yükleme, hata ve modal görünürlük yönetimi
- **Async Tercihler:** Bildirim toggle'ları `@studytrack_notifications` anahtarıyla AsyncStorage üzerinde saklanır

---

## 3. Navigasyon Mimarisi

- **Expo Router (Stack + Tab Hybrid):** `AppNavigator` içinde `AuthStack` ve `MainTabs` ayrımı; oturum durumuna göre otomatik yönlendirme
- **Alt Sekme Navigasyonu:** Dashboard, Plans, Goals, Tasks ve Profile sekmeleri; aktif sekme rengi temadan `theme.primary` ile dinamik
- **Odak Tabanlı Yenileme:** `useFocusEffect` hook'u ile ekrana her dönüşte veri yenileme; sekme geçişlerinde tutarlı veri durumu
- **Route Parametre Senkronizasyonu:** Dashboard'dan Tasks ekranına `filter: 'completed'` parametresi geçişi; `route.params` temizleme ile tekrar tetiklenme önlemi

---

## 4. Kimlik Doğrulama ve Güvenlik

- **JWT Bearer Token:** ASP.NET Core backend'den alınan token, tüm API isteklerinde `Authorization: Bearer <token>` header'ı olarak gönderilir
- **Axios Interceptors:** Her istekte `AsyncStorage.getItem('token')` ile dinamik header ekleme; `401` yanıtında otomatik oturum kapatma ve AsyncStorage temizleme
- **Kalıcı Oturum:** Uygulama kapandıktan sonra bile `AsyncStorage` üzerindeki token ve kullanıcı verisiyle otomatik oturum devamı
- **Güvenli Çıkış:** `Alert.alert` onaylı logout; `multiRemove(['token', 'user'])` ile AsyncStorage ve context state birlikte temizlenir
- **Form Doğrulama:** Login ve Register ekranlarında alan bazlı `fieldErrors` + genel `globalError` banner sistemi; regex e-posta kontrolü, minimum şifre uzunluğu doğrulaması

---

## 5. Dashboard Ekranı

- **Genel Durum Kartları:** Plan, Hedef, Görev ve Tamamlanan sayıları API'den çekilerek stat kartlarda gösterilir; `onPress` ile ilgili sekmeye yönlendirme
- **Hızlı Eylem Çubuğu:** "Yeni Plan / Yeni Hedef / Yeni Görev" butonları ScrollView dışında sabit bar olarak konumlandırılır; `onLayout` ile dinamik yükseklik ölçümü, `paddingBottom` otomatik ayarı
- **İlerleme Görselleştirme:** Tamamlanan/toplam görev yüzdesi ve anlık metrikler
- **Pull-to-Refresh:** `RefreshControl` bileşeni ile aşağı çekerek yenileme
- **Promise.allSettled:** Plans, Goals ve Tasks için paralel API istekleri; biri başarısız olsa diğerleri etkilenmez

---

## 6. Study Plans (Çalışma Planları)

- **CRUD İşlemleri:** Plan oluşturma, listeleme, güncelleme ve silme; `PUT /api/Plans/{id}`, `POST /api/Plans`, `DELETE /api/Plans/{id}`
- **Durum Yönetimi:** `Active`, `Completed`, `Paused` plan durumları; durum rozet renkleri
- **Tarih Alanları:** Başlangıç ve bitiş tarihi validasyonu
- **Optimistik UI:** İşlem sonrası `fetchData()` çağrısı ile liste anlık güncellenir

---

## 7. Goals (Hedefler)

- **CRUD İşlemleri:** Hedef oluşturma, listeleme, güncelleme ve silme; `PUT /api/Goals/{id}`, `POST /api/Goals`
- **Saat Hedefi:** `targetHours` alanı ile sayısal çalışma süresi takibi
- **Son Tarih Takibi:** `deadline` alanı; tarihe göre sıralama ve görsel gösterim
- **Tamamlanma İşareti:** `isAchieved` toggle ile hedef tamamlama

---

## 8. Tasks (Görevler) Ekranı

- **CRUD + Toggle:** Görev oluşturma, düzenleme, silme ve tamamlama durumu güncelleme; `PUT /api/Tasks/{id}`
- **Üç Seviyeli Filtre:** `all` / `pending` / `completed` sekme butonları; filtre durumu rengi temadan alınır
- **Route Param Filtresi:** Dashboard'daki "Tamamlanan" kartına basınca Tasks ekranı `completed` filtresiyle açılır; param okunduktan sonra `navigation.setParams({ filter: undefined })` ile temizlenir
- **toArray Yardımcı Fonksiyonu:** `.NET` JSON Serializer'ın `$values` formatını ve düz diziyi tek noktada normalize eder

---

## 9. Günlük Seri Sistemi (Daily Streak)

- **Frontend Hesaplama:** Backend'de `completedAt` alanı olmadığından `dueDate` proxy olarak kullanılır; tamamlanan görevlerin tarihleri `Set` yapısına alınır
- **Ardışık Gün Algoritması:** Bugünden geriye doğru 365 gün tarama; tarihin `Set`'te bulunduğu sürece sayaç artar, ilk boşlukta durur
- **Esnek Başlangıç:** Bugün için tamamlanan görev yoksa dün üzerinden seri hesabı başlar; sıfır streak durumu ayrı mesajla gösterilir
- **Dashboard + Profile Entegrasyonu:** Streak değeri her iki ekranda da görüntülenir

---

## 10. Rozet Sistemi (Badge System)

- **7 Rozet Tanımı:** `BADGE_DEFS` dizisi; her rozet için `emoji`, `label`, `desc` ve `check(stats)` fonksiyonu
- **Eşik Tabanlı Açılma Mantığı:**

  | Rozet | Koşul |
  |---|---|
  | 🏆 İlk Adım | ≥ 1 tamamlanan görev |
  | ⭐ Çalışkan | ≥ 5 tamamlanan görev |
  | 💪 Azimli | ≥ 10 tamamlanan görev |
  | 📋 Planlayıcı | ≥ 3 plan |
  | 🎯 Hedef Avcısı | ≥ 3 hedef |
  | 🔥 3 Gün Serisi | streak ≥ 3 |
  | 🌟 Süper Kullanıcı | 5 plan + 5 hedef + 10 görev |

- **Kilitli/Açık Görünüm:** Kilitli rozetler gri çember + 🔒 emoji + `opacity: 0.4`; açık rozetler sarı çember + gerçek emoji
- **İlerleme Özeti:** `X rozet kazandın, Y tane kaldı` dinamik mesajı

---

## 11. Profil Ekranı ve Hesap Yönetimi

- **Gerçek API İstatistikleri:** `Promise.allSettled` ile Plans, Goals, Tasks eşzamanlı çekilir; yükleme ve hata durumları ayrı gösterilir
- **Profili Düzenle Modali:** Ad/Soyad ve e-posta düzenleme; `PUT /api/Auth/profile` backend endpoint'i; başarı durumunda `updateUser` ile AuthContext ve AsyncStorage güncellenir
- **Bildirim Tercihleri Modali:** Günlük hatırlatma, görev son tarihi, hedef son tarihi toggle'ları; `@studytrack_notifications` anahtarıyla AsyncStorage kalıcılığı
- **Tema Seçim Modali:** 4 renk swatch'ı; seçim `setTheme(key)` ile ThemeContext'e delege edilir; tüm uygulamaya anlık yansır
- **Hakkında Modali:** Uygulama versiyonu, teknoloji stack'i, sunucu bilgisi
- **Animasyonlu Stat Kartları:** 6 istatistik (`Plan`, `Hedef`, `Görev`, `Tamamlanan`, `Seri`, `Rozet`) grid görünümde

---

## 12. Tema Değiştirme Sistemi

- **ThemeContext Mimarisi:** `src/context/ThemeContext.js`; `THEMES` objesi 4 temayı tanımlar; her tema `primary`, `secondary`, `background`, `surface`, `text`, `soft50/100`, `accent50/100` gibi 15+ renk token içerir
- **AsyncStorage Kalıcılığı:** Seçilen tema anahtarı `@studytrack_theme`'de saklanır; uygulama açılışında yüklenir
- **Statik StyleSheet Sorunu Çözümü:** `StyleSheet.create()` static olduğundan tema renkleri inline stil override'larıyla uygulanır; tab bar, butonlar, başlıklar, kartlar tema renklerinden beslenir
- **Tema Kapsamı:** Login, Register, Dashboard, Tasks, Profile, AppNavigator, StyledButton, StyledInput bileşenlerinin tamamı `useTheme()` hook'una bağlıdır

---

## 13. API Entegrasyonu ve Ağ Katmanı

- **Merkezi Axios Instance:** `src/api/axios.js`; `API_BASE_URL` sabitinden `baseURL` alır; tek noktadan yönetim
- **JWT Interceptor:** Her istekte `AsyncStorage.getItem('token')` ile dinamik `Authorization` header enjeksiyonu
- **401 Otomatik Logout:** Response interceptor'da `status === 401` algılandığında `AsyncStorage.multiRemove` + kayıtlı `_onUnauthorized` callback çağrısı
- **Unauthorized Handler:** Döngüsel import sorununu aşmak için modül seviyesinde `setUnauthorizedHandler(fn)` factory pattern
- **Hata Mesaj Yönetimi:** Backend'den gelen `error.response.data.message` Türkçe mesajları doğrudan kullanıcıya gösterilir
- **API_BASE_URL Yönetimi:** `src/constants/index.js`'de tek satır; Docker lokal (`http://10.132.200.196:10000/api`) veya Render üretim (`https://studytrack-api-nu1x.onrender.com/api`) arasında geçiş

---

## 14. Docker Backend Entegrasyonu

- **Lokal IP Tabanlı Bağlantı:** Expo uygulaması fiziksel cihazdan çalıştığında `localhost` container'a erişemez; host makinenin ağ IP adresi (`10.132.200.196`) kullanılır
- **Backend Container:** `studytrack-api` container'ı `10000` portunda çalışır; ASP.NET Core + SQLite; `studydb` Docker volume ile kalıcı veri
- **CORS Uyumluluğu:** Backend CORS politikası `http://localhost:*` ile birlikte her origin'e izin verecek şekilde yapılandırılmıştır; fiziksel cihaz IP'si de kabul edilir
- **Ortam Geçişi:** `API_BASE_URL` tek değişken; Docker testi için `http://<HOST_IP>:10000/api`, deploy için Render URL

---

## 15. Gerçek Cihaz Testi

- **Expo Go:** iOS ve Android fiziksel cihazlarda aynı ağ üzerinden QR kod ile uygulama testi
- **Metro Bundler:** `npx expo start --clear` ile cache temizlenmiş başlatma; Hot Reload ile anlık değişiklik yansıması
- **Fiziksel Cihaz Ağ Bağlantısı:** Host makinesi ile cihaz aynı Wi-Fi ağında olmalı; Expo tünel (`--tunnel`) alternatifte kullanılabilir
- **Platform Uyumluluğu:** `Platform.OS` kontrolü ile iOS/Android farkları (`KeyboardAvoidingView behavior`, güvenli alan insetleri) yönetilir
- **SafeAreaView:** `react-native-safe-area-context` ile notch ve sistem çubuğu uyumu; `edges={['top']}` ile hassas kontrol

---

## 16. Performans ve Kod Kalitesi

- **useFocusEffect + useCallback:** Ekran odak olaylarında gereksiz re-render önlenir; `fetchData` fonksiyonu memoize edilir
- **Promise.allSettled:** Paralel API çağrıları; tek başarısızlık tüm veriyi engellemez
- **Conditional Rendering:** Yükleme (`ActivityIndicator`), hata banner ve veri yokken boş durum mesajları ayrı ayrı yönetilir
- **StyleSheet.create:** Statik stiller dışarı alınır; inline stil kullanımı yalnızca dinamik tema renkleri için
- **toArray Yardımcı Fonksiyonu:** `.NET`'in `{ $values: [] }` formatı ve düz dizi arasında tek noktada normalizasyon; veri katmanı bozulmaz

---

## Dosya Yapısı

```
studytrack-mobile/
├── App.js                          # GestureHandlerRootView > SafeAreaProvider > ThemeProvider > AuthProvider > AppNavigator
├── src/
│   ├── api/
│   │   └── axios.js                # Merkezi Axios instance, JWT interceptor, 401 handler
│   ├── constants/
│   │   ├── index.js                # API_BASE_URL, motivasyon mesajları
│   │   └── colors.js               # Statik renk sabitleri (fallback)
│   ├── context/
│   │   ├── AuthContext.js          # token, user, login, logout, updateUser
│   │   └── ThemeContext.js         # THEMES, themeKey, setTheme, THEMES_LIST
│   ├── navigation/
│   │   └── AppNavigator.js         # AuthStack / MainTabs ayrımı
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── PlansScreen.js
│   │   ├── GoalsScreen.js
│   │   ├── TasksScreen.js
│   │   └── ProfileScreen.js
│   └── components/
│       ├── StyledInput.js          # Tema destekli input bileşeni
│       └── StyledButton.js         # Tema destekli buton bileşeni
```

---

## Kullanılan Teknolojiler

| Teknoloji | Versiyon | Kullanım Amacı |
|---|---|---|
| React Native | 0.76 | Mobil uygulama çatısı |
| Expo SDK | 54 | Managed workflow, cihaz API'leri |
| Expo Router | — | Tab + Stack navigasyon |
| React Navigation | — | `useFocusEffect`, navigasyon hook'ları |
| Axios | ^1.x | HTTP istek yönetimi, interceptor'lar |
| AsyncStorage | — | Token, kullanıcı ve tercih kalıcılığı |
| Context API | — | AuthContext, ThemeContext global state |
| react-native-safe-area-context | — | Notch/sistem çubuğu uyumu |
| ASP.NET Core 8 | — | REST API backend |
| SQLite | — | Backend veritabanı |
| Docker | — | Lokal backend container ortamı |

---

## Demo Video

> 📹 **Mobil Frontend Demo Videosu**
>
> _Video bağlantısı buraya eklenecek._
>
> **Videoda gösterilecekler:**
> - Expo Go ile gerçek cihazda çalışma
> - Login / Register akışı (JWT token alımı)
> - Dashboard — gerçek API verileri
> - Plan, Hedef, Görev ekleme / düzenleme / silme
> - Görev tamamlama ve streak hesabı
> - Rozet açılması
> - Profil düzenleme (PUT /api/Auth/profile)
> - Tema değiştirme (4 tema anlık geçiş)
> - Docker backend bağlantısı (`http://10.132.200.196:10000/api`)
