# Nadstrešnica — Android/iOS projekat

Ovaj folder sadrži kompletan Capacitor projekat koji pretvara web aplikaciju
u prave native Android i iOS projekte, spremne za kompajliranje.

## Šta je unutra
- `www/index.html` — cijela aplikacija (UI, login, radar, logika)
- `android/` — pravi Android Studio projekat
- `ios/` — pravi Xcode projekat
- `capacitor.config.json` — konfiguracija (app ID, ime)

## Šta ti treba da nastaviš (ovo se NE može uraditi u ovom razgovoru)

### Za Android:
1. Instaliraj [Android Studio](https://developer.android.com/studio)
2. Otvori folder `android/` kao postojeći projekat
3. Klikni Build → Build Bundle(s)/APK(s) → Build APK
4. Za Play Store: napravi [Google Play Console nalog](https://play.google.com/console) ($25 jednokratno), napravi "signed" build (Build → Generate Signed Bundle), i uploaduj `.aab` fajl

### Za iOS:
1. Treba ti Mac sa instaliranim Xcode-om
2. Otvori `ios/App/App.xcworkspace`
3. Poveži svoj [Apple Developer nalog](https://developer.apple.com/programs/) ($99/godišnje)
4. Product → Archive, pa upload preko Xcode Organizer-a na App Store Connect

## Backend

Web app sada ima **pravu integraciju sa backend-om**, sa offline fallback-om:
- Ako `window.NADSTRESNICA_API_BASE` u `www/index.html` (na vrhu `<head>`) nije
  postavljen, app radi u lokalnom demo režimu (sve u memoriji, nestaje pri
  zatvaranju) — dobro za testiranje bez servera
- Kad postaviš pravi URL (nakon deploy-a backend-a), app se automatski
  povezuje: login/registracija idu na pravi server, detekcije se čuvaju u
  bazi, i status "Povezano"/"Offline režim" se prikazuje u vrhu ekrana

Da povežeš pravi backend:
1. Deploy-uj `backend-server/` na [Railway](https://railway.app),
   [Render](https://render.com) ili slično. Postavi environment varijable iz
   `.env.example` (obavezno pravi `JWT_SECRET`, minimum 32 karaktera, i
   `ALLOWED_ORIGIN` na tvoj stvarni domen za produkciju)
2. U `www/index.html`, promijeni `window.NADSTRESNICA_API_BASE = ''` na
   `window.NADSTRESNICA_API_BASE = 'https://tvoj-backend.up.railway.app'`
3. Pokreni `npx cap sync` da se izmjena prenese u Android/iOS projekte

## Sigurnost backend-a (dodano)
- Rate limiting na login/registraciju (max 10 pokušaja / 15 min po IP adresi)
- `helmet` middleware za sigurnosne HTTP headere
- CORS ograničen na `ALLOWED_ORIGIN` (podesi ga u produkciji, ne ostavljaj `*`)
- Server sada **odbija da se pokrene** ako `JWT_SECRET` nije eksplicitno
  postavljen — spriječava slučajno korištenje default vrijednosti u produkciji

## GPS i mapa (dodano)
- App traži pristup GPS lokaciji uređaja pri pokretanju (`navigator.geolocation`)
- Ako korisnik odbije pristup, app to jasno prikazuje umjesto da tiho ne radi
- U Postavkama, dugme "Nacrtaj zonu na mapi" otvara pravu OpenStreetMap/Leaflet
  mapu gdje korisnik klikom postavlja tačke oko svog imanja (poligon, ne
  fiksni krug) — zona se čuva lokalno na uređaju

## Šta NIJE dodano u ovom prolazu (zahtijeva tvoje kredencijale)
- **Push notifikacije (Firebase Cloud Messaging)** — ne mogu ovo sam
  postaviti jer zahtijeva da napraviš Firebase projekat na svom Google nalogu
  i daš mi `google-services.json` (Android) / `GoogleService-Info.plist`
  (iOS) konfiguracijske fajlove. Kad ih imaš, mogu ih ubaciti i povezati
  backend da šalje notifikacije kad stigne detekcija
- **GDPR pravni pregled** — nacrt politike privatnosti postoji, ali treba
  pravnika za stvarnu usklađenost prije lansiranja u Njemačkoj

## Šta aplikacija radi (i ne radi)

Radi: detekcija dronova (simulirana dok se ne poveže pravi RF/Remote ID
hardver), identifikacija proizvođača, upozorenje korisniku, evidencija upada,
priprema i slanje izvještaja, i endpoint za označavanje da su vlasti
obaviještene.

Ne radi i neće raditi: bilo kakva kontrola, ometanje, prizemljenje ili
preusmjeravanje tuđeg drona. Ovo je namjerna i trajna granica projekta, ne
tehničko ograničenje koje će se kasnije ukloniti.

## Sljedeći koraci prije objave na store-ovima
- [ ] Prava ikonica aplikacije (zamijeni default Capacitor ikonice u
      `android/app/src/main/res/` i `ios/App/App/Assets.xcassets/`)
- [ ] Politika privatnosti objavljena na javnom URL-u (obavezno za obje
      store — nacrt je u `PRIVACY_POLICY.md`)
- [ ] Povezan pravi backend umjesto lokalne simulacije
- [ ] Testiranje na stvarnim uređajima
- [ ] Store opis, screenshotovi, kategorija aplikacije
