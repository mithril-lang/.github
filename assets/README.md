# Mithril Chat avatar

`mithril-mark-512.png` is a 512 × 512 PNG render of the canonical Mithril crystal mark and dark tile. The source is `mithril-lang/design-system/resources/mithril-mark.svg` (SHA-256 `fe5fa17d9a2731dcba8a7f16299554717cb4048fddcf137c93f9dc7ab4e8943f`), which matched the live `https://mithril.fund/assets/mithril-mark.svg` on 2026-10-27.

Render without changing the artwork:

```sh
rsvg-convert --width 512 --height 512 --format png --output mithril-mark-512.png mithril-mark.svg
```

Google Chat requires a public HTTPS square PNG or JPEG avatar URL. This public asset is used by the Mithril Agent Chat app.
