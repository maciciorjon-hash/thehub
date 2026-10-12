# Labbook — the iPhone app

The bench notebook as a real app: experiments (tick steps, timers, photos), Archive protocols with their calculators,
and Cells (cultures, lines, freezer). Self-contained — the page, the Firebase SDK, the fonts and SheetJS are all inside
the bundle — so it opens with no signal and syncs to the same Firebase notebook as the laptop whenever there is one.
Data analysis (Echo, Lumina, Hit Finder, Tempo …) stays on the laptop.

It is the same Labbook page as the installable web app (`dist/labbook-6b1d0c4f9a72/`), packaged with Capacitor.
`www/` is generated; nothing in it is edited by hand.

```
python3 embed.py --profile=labbook-app     # writes mobile/www  (what `npm run build:web` does)
cd mobile && npm install                   # once
npm run sync                               # rebuild www and copy it into the Xcode project
npm run open                               # opens ios/App in Xcode
```

## First install on the phone (needs Xcode — free, Mac App Store)

1. Install Xcode, open it once, accept the licence, then `sudo xcode-select -s /Applications/Xcode.app`.
2. `npm run open`. In Xcode pick the **App** target → *Signing & Capabilities* → tick *Automatically manage signing* and
   choose your Team (your Apple ID is enough). If the bundle id `com.maciciorjon.labbook` is taken, change it.
3. Plug the iPhone in (Settings → Privacy & Security → Developer Mode on), choose it as the run target, press ▶.
4. First launch on the phone: Settings → General → VPN & Device Management → trust your Apple ID.

A free Apple ID signs the app for **7 days**; reinstall from Xcode (data is kept) when it stops opening. A paid Apple
Developer Program membership (99 USD/yr) makes it last a year and enables TestFlight, which is the "app store" route:
Product → Archive → Distribute → App Store Connect, then install from TestFlight on the phone (builds last 90 days).

## Signing in

Google sign-in cannot complete inside an iOS web view, so the app signs in with **email + password** (`LB_NATIVE`).
Once only: in the Firebase console enable *Authentication → Sign-in method → Email/Password*, then on the laptop (signed
in with Google) open Labbook → Settings → About → *Set a password for the phone*. The phone keeps the session, offline
included.

## What is in `ios/` that is yours

`ios/App/App/Info.plist` (camera and photo usage text, no export-compliance prompt) and `Assets.xcassets/AppIcon`
(`python3 tools/make_icons.py --app=labbook` rewrites the 1024 px icon). `ios/App/App/public` and the generated Capacitor
config are not committed.

## Checks

`node tools/phone_app_invariants.mjs` (needs `mobile/www`) — PA1–PA8: the door to Cells, no network needed, one store,
frames that are not reloaded, offline edits that survive the app being closed, no demo-inventory seeding, the layout,
no Google sign-in.
