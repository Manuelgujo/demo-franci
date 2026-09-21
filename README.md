# Sito di Francesca Pirazzo — Jekyll + GitHub Pages + Sveltia CMS

Questo è un sito statico (Jekyll), pensato per essere ospitato **gratuitamente** su GitHub Pages, con un pannello di editing del blog (Sveltia CMS) utilizzabile senza scrivere codice.

---

## 1. Metti il sito su GitHub

1. Crea un account su [github.com](https://github.com) se non ne hai già uno.
2. Crea un nuovo repository (es. `sito-web`). Può essere pubblico o privato — GitHub Pages funziona in entrambi i casi con un account gratuito, a patto che il repo sia pubblico se usi un account gratuito senza GitHub Pro/Team (per i privati serve un piano a pagamento GitHub, non l'hosting in sé che resta gratis).
3. Carica **tutti i file di questa cartella** nel repository (via web "Add file → Upload files", oppure con Git da terminale se preferisci).

## 2. Attiva GitHub Pages

1. Nel repository, vai su **Settings → Pages**.
2. In "Build and deployment", seleziona **Deploy from a branch**, branch `main`, cartella `/ (root)`.
3. Salva. Dopo 1-2 minuti il sito sarà visibile su `https://TUO-USERNAME.github.io/TUO-REPO/`.

### (Opzionale) Dominio personalizzato
Se compri un dominio tuo (es. francescapirazzo.it):
1. Aggiungi un file `CNAME` nella root del repo con dentro scritto solo `www.francescapirazzo.it`.
2. Dal pannello del tuo provider di dominio, punta un record CNAME a `TUO-USERNAME.github.io`.
3. In Settings → Pages, inserisci lo stesso dominio nel campo "Custom domain".

**Importante:** una volta scelto il dominio definitivo, aggiorna anche `url:` in `_config.yml` — da lì dipendono sitemap, meta tag e dati strutturati per la SEO.

## 3. Configura il pannello di editing del blog (Sveltia CMS)

1. Apri `admin/config.yml` e sostituisci `TUO-USERNAME/TUO-REPO` con il nome reale del tuo repository (es. `francescapirazzo/sito-web`).
2. Genera un **Personal Access Token** su GitHub, che farà da "password" per accedere all'editor:
   - Vai su GitHub → icona del profilo → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - Dai un nome al token (es. "Editor blog sito").
   - In "Repository access", seleziona **Only select repositories** e scegli il tuo repository.
   - In "Permissions", imposta **Contents: Read and write**.
   - Genera il token e **copialo subito** (non sarà più visibile dopo).
3. Consegna questo token a Francesca (via un canale sicuro, es. un messaggio privato) insieme a queste istruzioni:
   > Vai su `tuosito.it/admin`, incolla il token quando richiesto al primo accesso, e da lì potrai scrivere nuovi articoli con un editor semplice: titolo, categoria, testo, e un bottone "Pubblica". Nella sezione **Servizi offerti** può anche aggiungere, modificare, riordinare, nascondere o eliminare i servizi (ognuno ha la sua card in homepage e la sua pagina). Ogni pubblicazione aggiorna il sito in 1-2 minuti.

Il token è come una password: **va conservato con cura** e può essere revocato in qualsiasi momento dalla stessa pagina di GitHub in cui è stato creato.

## 4. Come funziona la SEO in questo sito

- **jekyll-seo-tag** genera automaticamente title, meta description, canonical, Open Graph e Twitter Card per ogni pagina — l'equivalente diretto di Yoast, ma nativo di Jekyll.
- **jekyll-sitemap** rigenera da solo `sitemap.xml` a ogni pubblicazione, includendo automaticamente i nuovi articoli.
- I dati strutturati (Schema.org) sono già inclusi: profilo professionale (`Psychologist`) in homepage e, in ogni pagina servizio, `Service` e `FAQPage`, generati in automatico dai campi del servizio (anche per quelli creati dal CMS).
- Il file NAP (Nome, indirizzo, telefono, P.IVA) è centralizzato in `_config.yml` sotto la chiave `nap:` — cambialo una sola volta lì e si aggiorna ovunque nel sito (footer, contatti, privacy policy).

## 5. Prima di andare online: cosa personalizzare

- `_config.yml` → sezione `nap:` (indirizzo, telefono, email, P.IVA, numero Albo reali)
- `admin/config.yml` → nome del repository GitHub
- Considera di far rivedere la Privacy Policy (`privacy-policy.html`) da un consulente privacy/legale, dato che il sito raccoglie anche potenziali dati sanitari tramite il form.

## 6. Struttura del progetto

```
_config.yml          → impostazioni generali del sito + NAP
_layouts/             → gli "stampi" HTML condivisi (homepage, servizio, articolo)
_includes/             → header, footer e icone dei servizi (icon.html)
_servizi/              → le pagine dei servizi, un file .md ciascuno (gestibili dal CMS)
_posts/                → gli articoli del blog (un file = un articolo)
admin/                → il pannello di editing (Sveltia CMS)
assets/css/style.css   → tutto lo stile del sito
index.html             → homepage
blog.html              → elenco di tutti gli articoli
privacy-policy.html    → informativa privacy
```

Per aggiungere un nuovo articolo **senza usare il pannello /admin**, basta anche solo copiare un file esistente in `_posts/`, rinominarlo con la data odierna e modificarne il contenuto — Jekyll farà il resto.

## 7. Gestire i servizi

Dal pannello `/admin` → **Servizi offerti**: nuovo servizio, modifica o eliminazione. Ogni servizio è un file in `_servizi/` con questi campi: nome breve (`card_title`), posizione (`order`, il numero più basso compare prima), icona (`icon`, scelta da un elenco), descrizione della card, titolo e descrizione SEO, titolo della pagina (`h1`), frase introduttiva (`lede`), elenco «Per chi è pensato» (`per_chi`), FAQ (`faq`) e testo in Markdown. Con `published: false` (interruttore «Visibile sul sito») un servizio sparisce da homepage e sito senza essere eliminato.

L'indirizzo della pagina nasce dal nome del file (`_servizi/ansia-e-stress.md` → `/servizi/ansia-e-stress/`); cambiare il nome breve dopo la creazione non modifica l'indirizzo.

**Aggiungere una nuova icona**: inserire un blocco `{% when "nome" %}...` in `_includes/icon.html` (stile 24x24, tratto 1.6, senza riempimento) e una voce nell'elenco `icon` di `admin/config.yml`.
