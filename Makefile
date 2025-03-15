# Read version from package.json
VERSION := $(shell jq -r '.version' package.json)
PRODUCT_NAME := $(shell jq -r '.productName' package.json)

# Define the DMG file name
DMG_FILE := "dist/$(PRODUCT_NAME)-$(VERSION)-arm64.dmg"

# Ensure jq is installed
$(shell command -v jq >/dev/null 2>&1 || { echo "jq is not installed. Please install it first: https://stedolan.github.io/jq/download/"; exit 1; })

.PHONY: dist release clean

dist: $(DMG_FILE)
$(DMG_FILE):
	npm run app:dist

tag:
	# Create a new tag
	git tag -a "v$(VERSION)" -m "version++ (v$(VERSION))" && \
	git push origin "v$(VERSION)"

release: tag dist
	# Create a new GitHub release
	gh release create "v$(VERSION)" \
		--title "$(PRODUCT_NAME) v$(VERSION)" \
		--generate-notes \
		$(DMG_FILE)

clean:
	rm -f "Canvas Browser-*-*-*-*"
