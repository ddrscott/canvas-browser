# Read version from package.json
VERSION := $(shell jq -r '.version' package.json)
PRODUCT_NAME := $(shell jq -r '.productName' package.json)

# Define the DMG file name
DMG_FILE := "$(PRODUCT_NAME)-$(VERSION)-arm64.dmg"

# Ensure jq is installed
$(shell command -v jq >/dev/null 2>&1 || { echo "jq is not installed. Please install it first: https://stedolan.github.io/jq/download/"; exit 1; })

.PHONY: dist release clean

dist: $(DMG_FILE)
$(DMG_FILE):
	npm run app:dist

release: dist
	# Create a new GitHub release
	gh release create "v$(VERSION)" \
		--title "Canvas Browser v$(VERSION)" \
		--description "Release of Canvas Browser version $(VERSION)" \
		--asset $(DMG_FILE) \
		--generate-notes

clean:
	rm -f "Canvas Browser-*-*-*-*"
