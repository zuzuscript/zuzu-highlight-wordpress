# Zuzu Highlight WordPress Plugin

This WordPress plugin wraps `zuzu-highlight-js` and applies ZuzuScript syntax
highlighting to public pages.

Add the `zuzu-highlight` class to a ZuzuScript code block:

```html
<pre class="zuzu-highlight"><code>say "Hello from ZuzuScript"</code></pre>
```

The plugin enqueues `assets/zuzu-highlight.js`. The bundled browser script
highlights matching `<pre class="zuzu-highlight">` blocks when the document
loads.

The plugin also enqueues `assets/zuzu-highlight-theme.css`, which overrides the
default `zuzu-highlight-js` colours with the same light and dark code palette
used by Zuzulang.org.

## Settings

In WordPress, go to **Settings > Zuzu Highlight** to choose the rendering mode:

- Follow the visitor colour scheme
- Always dark mode
- Always light mode

## Development

Refresh the vendored highlighter from the sibling source checkout:

```bash
make update-assets
```

Run validation:

```bash
make test
```

Build an installable WordPress plugin zip:

```bash
make dist
```
