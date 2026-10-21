# Suhbat

Real vaqtli chat ilovasi: **React + Vite + TypeScript** frontend va **Node.js + WebSocket** backend.
Keyinchalik xuddi shu web build'dan **EXE** (Electron) va **APK** (Capacitor) tayyorlanadi.

## Imkoniyatlari

- Onlayn xabarlar (WebSocket, real vaqt)
- Xonalar: yaratish va almashtirish
- Onlayn foydalanuvchilar ro'yxati
- "Yozmoqda..." indikatori
- O'qilmagan xabarlar hisoblagichi
- Xabarlar tarixi (JSON faylda saqlanadi)
- Avtomatik qayta ulanish
- Mobil qurilmalarga moslashgan interfeys
- Flood himoyasi (5 soniyada 8 tadan ko'p xabar yuborilmaydi)

## Lokal ishga tushirish

Talab: **Node.js 20+**.

```powershell
cd chat-app
npm install
npm run dev
```

- Frontend: http://localhost:5173 (hot reload)
- Backend: http://localhost:3001

Production ko'rinishi (bitta port):

```powershell
npm run build
npm start
```

So'ng http://localhost:3001 ni oching.

Ikkinchi foydalanuvchini sinash (terminalda):

```powershell
node scripts/test-client.mjs Dilnoza
```

## Tuzilma

```
chat-app/
├─ client/            # React + Vite + TS
│  ├─ src/
│  │  ├─ components/  # Login, Sidebar, ChatScreen, MessageList, Composer
│  │  ├─ hooks/       # useChat — socket va holat boshqaruvi
│  │  └─ lib/         # utils (vaqt, avatar, socket URL)
│  └─ .env.example    # VITE_WS_URL (ajratilgan hosting uchun)
├─ server/
│  ├─ src/index.js    # Express + WebSocket server
│  ├─ src/store.js    # JSON faylga saqlash
│  └─ data/db.json    # xabarlar bazasi (git'ga tushmaydi)
├─ scripts/           # test klient
├─ render.yaml        # Render.com deploy konfiguratsiyasi
├─ Dockerfile
└─ package.json       # npm workspaces
```

## Bepul deploy: GitHub + Render

1. **GitHub repo yaratish** (public yoki private — ikkalasi ham bepul).
2. Kodni push qilish.
3. [render.com](https://render.com) → **New → Web Service** → GitHub repo'ni ulash.
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Health check: `/api/health`
4. Deploy tugagach `https://<nom>.onrender.com` havolasini do'stlarga yuboring.

`render.yaml` mavjud bo'lsa, Render → **New → Blueprint** orqali ham bir bosishda sozlanadi.

### Bepul tarif cheklovlari

| Cheklov | Ta'siri | Yechim |
|---|---|---|
| 15 daqiqa harakatsizlikdan keyin uyqu | Birinchi kirish 30–60 s | Birinchi ochilishda kuting |
| Disk vaqtinchalik | Restart/redeploy'da xabarlar o'chadi | `DATA_DIR` + pullik disk yoki Postgres |
| 512 MB RAM | Kichik guruh uchun yetarli | Keyinchalik kattalashtirish |

## Alternativa: GitHub Pages (frontend) + Render (server)

GitHub Pages faqat statik fayllarni beradi, WebSocket server yo'q. Shuning uchun:

1. Render'da serverni joylashtiring.
2. `client/.env.production` faylida:
   ```
   VITE_WS_URL=https://suhbat.onrender.com
   ```
3. `npm run build` va `client/dist` ni GitHub Pages'ga chiqaring.

Server WebSocket ulanishlarini istalgan domendan qabul qiladi, qo'shimcha CORS sozlash shart emas.

## Muhim eslatmalar

- **Parol yo'q**: ism kiritib kiriladi; istalgan odam istalgan ismni tanlashi mumkin. Ommaviy ulashishdan oldin autentifikatsiya qo'shish tavsiya etiladi.
- **Identifikatsiya**: token brauzer `localStorage`ida saqlanadi, shuning uchun bitta brauzerda bitta foydalanuvchi.
- **HTTPS** ishlatilganda WebSocket avtomatik `wss://` bo'ladi.

## Keyingi qadamlar

- [ ] EXE: Electron bilan o'rash
- [ ] APK: Capacitor (Android SDK kerak)
- [ ] Parol / kirish kodi
- [ ] Postgres yoki SQLite bilan doimiy saqlash
- [ ] Fayl va rasm yuborish
- [ ] Ovozli xabarlar
