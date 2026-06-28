# Always · A Little Spell of Love ✦

A magical, romantic Harry Potter–themed website built as a gift. It has three enchantments:

1. **The Great Hall of Memories** — a photo gallery that auto-shows any image you put in `media/photos/`.
2. **The Cringe Spellbook** — a "Cringe Songs" button that plays a random song from `media/songs/`.
3. **Owl Post** — a complaints/confessions box. You write a message, it asks **"From:"**, then saves it. Reopen the site and every note is listed with the sender and timestamp as the title; click one to read it.

Built with Node.js + Express and a plain HTML/CSS/JS frontend (no build step).

> 🔒 **Private by default.** The whole site sits behind a romantic "Portrait Hole" password page. The password is **`polkadot`** (change it any time with the `SITE_PASSWORD` setting). A 🔒 link in the footer re-locks it when you hand someone your phone.

---

## Run it locally

```powershell
npm install
npm start
```

Then open <http://localhost:3000>. (Use `npm run dev` to auto-restart on code changes.)

Complaints are saved to a local file (`data/complaints.json`) when no database is configured — perfect for testing.

---

## Add photos & songs (the auto-magic ✨)

- **Photos:** drop image files (`jpg, jpeg, png, gif, webp, avif, bmp`) into `media/photos/`.
- **Songs:** drop audio files (`mp3, m4a, ogg, wav, aac, flac, opus`) into `media/songs/`.

Running locally, just refresh the page. On the live site, commit the files and push — it redeploys and they appear.

> Tip: prefix filenames with numbers (e.g. `01-first-date.jpg`) to control the photo order.

---

## Put it online (free)

The live site needs persistent storage for complaints, so it uses a **free MongoDB Atlas** database.

### 1. Create the free database
1. Sign up at <https://www.mongodb.com/atlas> and create a free **M0** cluster.
2. Under **Database Access**, create a user + password.
3. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`).
4. Click **Connect → Drivers** and copy the connection string. It looks like:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### 2. Deploy to Render
1. Push this project to a GitHub repo.
2. At <https://render.com>, choose **New → Blueprint** and pick the repo (it reads `render.yaml`),
   or **New → Web Service** with Build `npm install` and Start `node server.js`.
3. In the service's **Environment** tab, add:
   - `MONGODB_URI` = your Atlas connection string
   - `MONGODB_DB` = `romantic_hp`
   - `SITE_PASSWORD` = the password to enter the site (e.g. `polkadot`)
4. Deploy. Render gives you a public URL to share. 💛

> Note: Render's free tier sleeps after inactivity, so the first visit may take ~30 seconds to wake up.

---

## How complaints stay safe
- With `MONGODB_URI` set → stored in MongoDB Atlas (survives redeploys, works across devices).
- Without it → stored in a local `data/complaints.json` file (great for local testing).

Messages are always displayed as plain text, so pasted code or symbols can never run in the page.

---

## Project layout

```
romantic-hp-site/
├─ server.js              # Express app
├─ render.yaml            # one-click Render deploy config
├─ .env.example           # copy to .env to configure locally
├─ src/
│  ├─ db.js               # complaints storage (Mongo or local file)
│  ├─ lib/mediaFolder.js  # reads a media folder into a file list
│  └─ routes/             # photos.js, songs.js, complaints.js
├─ public/                # index.html, styles.css, app.js (the magic UI)
└─ media/
   ├─ photos/             # drop photos here
   └─ songs/              # drop songs here
```

Mischief managed. ⚡
