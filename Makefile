PLUGIN_SLUG = zuzu-highlight
ZIP_FILE = $(PLUGIN_SLUG).zip
STAGING_DIR = .dist-build
HIGHLIGHT_SOURCE = ../zuzu-highlight-js/zuzu-highlight.js
HIGHLIGHT_ASSET = assets/zuzu-highlight.js
THEME_ASSET = assets/zuzu-highlight-theme.css

.PHONY: all dist test clean update-assets

all: dist

update-assets:
	cp $(HIGHLIGHT_SOURCE) $(HIGHLIGHT_ASSET)

test:
	php -l zuzu-highlight-wordpress.php
	node --check $(HIGHLIGHT_ASSET)
	test -s $(THEME_ASSET)

dist: test
	rm -rf $(STAGING_DIR)
	mkdir -p $(STAGING_DIR)/$(PLUGIN_SLUG)/assets
	cp README.md CHANGELOG.md zuzu-highlight-wordpress.php $(STAGING_DIR)/$(PLUGIN_SLUG)/
	cp $(HIGHLIGHT_ASSET) $(THEME_ASSET) $(STAGING_DIR)/$(PLUGIN_SLUG)/assets/
	rm -f $(ZIP_FILE)
	cd $(STAGING_DIR) && zip -q -r ../$(ZIP_FILE) $(PLUGIN_SLUG)
	rm -rf $(STAGING_DIR)

clean:
	rm -rf $(STAGING_DIR) $(ZIP_FILE)
