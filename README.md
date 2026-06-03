# Valor Logistics — Website

The official website for **Valor Logistics**, a trucking company offering **$0 down lease purchase**
opportunities for owner-operators.

The entire site is a single, self-contained file: **`index.html`**. All logos, photos, fonts, styles,
and scripts are built directly into that one file, so there are no other assets, folders, or
dependencies to manage.

---

## What's in this folder

| File | Purpose |
|------|---------|
| `index.html` | The complete website. This is the only file that needs to be served. |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is (recommended for plain HTML sites). |
| `README.md` | This file. Not part of the live site. |

---

## How to host it on GitHub Pages (free, no coding)

1. **Create a GitHub account** at https://github.com (if you don't have one).

2. **Create a new repository**
   - Click the **+** (top right) → **New repository**.
   - Name it `valor-logistics` — or, for the cleanest URL, name it exactly
     `yourusername.github.io`.
   - Set it to **Public** and click **Create repository**.

3. **Upload these files**
   - On the new repo page, click **Add file → Upload files**.
   - Drag in **`index.html`** and **`.nojekyll`** (you can include `README.md` too).
   - Keep the file named exactly `index.html` — that's what loads as the homepage.
   - Click **Commit changes**.

4. **Turn on GitHub Pages**
   - Go to the repo's **Settings** tab → **Pages** (left sidebar).
   - Under **Source**, choose **Deploy from a branch**.
   - Set **Branch: `main`** and **Folder: `/ (root)`**, then click **Save**.

5. **Get your live link**
   - Wait about a minute, then refresh the Pages settings page.
   - It will show **"Your site is live at …"**
     - Repo named `valor-logistics` → `https://yourusername.github.io/valor-logistics/`
     - Repo named `yourusername.github.io` → `https://yourusername.github.io/`

That's it — the site is live.

---

## Updating the site later

Whenever you have a new version of `index.html`:

1. Go to your repository on GitHub.
2. **Add file → Upload files**, drag in the new `index.html`, and **Commit changes**.
3. The live site refreshes within about a minute.

---

## Using your own domain (optional)

If you own a domain (e.g., `valorlogistics.com`):

1. In **Settings → Pages → Custom domain**, enter your domain and click **Save**.
2. At your domain registrar, add the DNS records GitHub provides:
   - An `A` (or `ALIAS`) record for the root domain pointing to GitHub Pages.
   - A `CNAME` record for `www` pointing to `yourusername.github.io`.
3. Allow some time for DNS to propagate, then enable **Enforce HTTPS**.

---

## Notes

- **Apply Now** buttons open the AWL Transport / IntelliApp driver application in a new tab.
- The **contact form** currently opens the visitor's own email app, pre-addressed to
  `info@auxegenfund.com`. To have submissions delivered to your inbox automatically, connect the
  form to a free service such as Formspree (a small change to `index.html`).
- Contact phone on the site: **(317) 516-0653**.
