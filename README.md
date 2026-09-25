# Nimble Orbit Studio

Stable website source and static output for nimbleorbitstudio.com.

## Structure

- `index.html`, `styles.css`, `app.js` are the editable source files.
- `assets/` contains brand and gameplay media.
- `out/` is the static output deployed to the ChatGPT Site.
- `.openai/hosting.json` connects this checkout to the ChatGPT Site project.

## Local preview

Serve the static output from `out/`:

```powershell
python -m http.server 5174 --bind 127.0.0.1
```
