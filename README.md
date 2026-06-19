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
