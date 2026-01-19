# HYPE/USDC Spot Price Widget

An iOS widget that displays real-time HYPE/USDC spot prices from Hyperliquid's Layer 1. Built with Scriptable for easy customization and deployment.

![Widget Preview](preview.png)

## Overview

This widget connects directly to Hyperliquid's public API to fetch and display the current spot price for HYPE/USDC. The design features a clean, minimal interface with a rounded card layout that fits naturally on your home screen.

The widget updates automatically according to iOS scheduling (typically every 15 minutes), and you can manually refresh by opening the script in Scriptable. All data is fetched from public endpoints with no authentication required.

## Features

The widget displays several key pieces of information:

- Current HYPE/USDC spot price with four decimal precision
- 24-hour price change percentage with color-coded indicators (green for positive, red for negative)
- Last update timestamp showing when the data was fetched
- Clean card-based layout with rounded corners and subtle background contrast

All styling is customizable through configuration variables at the top of the script file.

## Requirements

To use this widget, you need:

- An iPhone running iOS 14 or later
- The Scriptable app installed from the App Store (free)

Scriptable is a third-party app that enables JavaScript-based widgets on iOS. It's available at no cost and doesn't require any subscriptions.

## Installation

### Step 1: Install Scriptable

Download Scriptable from the App Store if you haven't already. The app is free and doesn't require any in-app purchases.

### Step 2: Create the Script

1. Open the Scriptable app
2. Tap the plus button in the top right to create a new script
3. Copy the entire contents of `spot_price.js` into the script editor
4. Tap the script name at the top to rename it (something like "HYPE Price" works well)
5. Tap Done to save

### Step 3: Add to Home Screen

1. Long-press on your home screen to enter edit mode
2. Tap the plus button in the top left corner
3. Search for "Scriptable" in the widget gallery
4. Select your preferred widget size (small, medium, or large)
5. Tap Add Widget to place it on your home screen
6. Long-press the newly added widget and select Edit Widget
7. Choose your "HYPE Price" script from the list

The widget should now appear on your home screen and begin fetching data.

## Configuration

The widget is highly customizable through variables defined at the top of the script file. You can modify colors, enable or disable features, and even add custom branding.

### Color Customization

The color palette is defined in the `COLORS` object. Each color serves a specific purpose:

```javascript
var COLORS = {};
COLORS['bg'] = new Color('#E5E7EB');      // Outer background color
COLORS['card'] = new Color('#FFFFFF');    // Card background (white)
COLORS['green'] = new Color('#059669');   // Positive change indicator
COLORS['red'] = new Color('#DC2626');    // Negative change indicator
COLORS['text'] = new Color('#1F2937');    // Primary text color
COLORS['purple'] = new Color('#6366F1');  // Price text color
COLORS['black'] = new Color('#111827');   // Timestamp text color
```

Adjust these hex values to match your preferred color scheme. The current palette uses darker, more saturated colors for better visibility against the white card background.

### Custom Logo or Image

You can add your own logo or branding image to the widget. There are two methods:

**Method 1: Remote Image URL**

Set the `CUSTOM_IMAGE_URL` variable to point to an image hosted online:

```javascript
var CUSTOM_IMAGE_URL = 'https://your-domain.com/logo.png';
```

The widget will attempt to load this image when it renders. Make sure the URL is publicly accessible and the image format is supported (PNG, JPEG, etc.).

**Method 2: Local Image File**

If you prefer to use a local image file:

1. Save your image file to Scriptable's iCloud folder (accessible through the Files app)
2. Set the `CUSTOM_IMAGE_LOCAL` variable to the filename:

```javascript
var CUSTOM_IMAGE_LOCAL = 'logo.png';
```

The widget will look for this file in Scriptable's document directory. If the image can't be loaded for any reason, the widget falls back to displaying text.

### Layout Options

The widget includes a few layout configuration options:

```javascript
var USE_GRADIENT_BG = false;  // Set to true for gradient backgrounds
var USE_CARD_LAYOUT = true;   // Card layout is currently enabled
```

The card layout wraps all content in a white rounded rectangle with padding. The gradient background option is available but currently disabled in favor of a solid background color.

### Tracking Other Spot Pairs

While this widget is configured for HYPE/USDC, you can modify it to track other spot pairs on Hyperliquid. The key is finding the correct identifier for your desired pair.

HYPE/USDC uses the identifier `@107` on mainnet. To find other pairs:

1. Check Hyperliquid's spot metadata endpoint
2. Look for the index number associated with your desired trading pair
3. Replace `@107` in the script with the appropriate identifier

Some pairs may use different formats. For example, PURR/USDC uses the string identifier `PURR/USDC` rather than an index-based format.

## How It Works

The widget operates by making HTTP requests to Hyperliquid's public Info API. No authentication or API keys are required.

### API Endpoints

The widget uses two endpoints:

**Current Spot Prices**

```
POST https://api.hyperliquid.xyz/info
Body: { "type": "allMids" }
```

This returns a mapping of all current spot prices. HYPE/USDC is accessed via the `@107` key in the response.

**24-Hour Price Data**

```
POST https://api.hyperliquid.xyz/info
Body: {
  "type": "candleSnapshot",
  "req": {
    "coin": "@107",
    "interval": "1d",
    "startTime": <timestamp>,
    "endTime": <timestamp>
  }
}
```

This returns candle data used to calculate the 24-hour price change percentage.

### Data Flow

1. When the widget needs to update, it makes both API requests
2. The current price is extracted from the `allMids` response
3. The 24-hour change is calculated by comparing the open and close prices from the candle data
4. The widget renders this information in the configured layout
5. iOS handles the scheduling of updates (typically every 15 minutes)

All network requests use HTTPS and the widget only reads data. It cannot modify anything on Hyperliquid or access any private information.

## Limitations

There are a few important limitations to be aware of:

**Update Frequency**

iOS controls when widgets refresh. The system typically updates widgets every 15 minutes or so, but this isn't guaranteed. You can't force more frequent updates from within the widget itself.

**No Real-Time Updates**

This is an iOS limitation, not a limitation of the widget code. For truly real-time price data, you'd need to use the Hyperliquid web app or mobile app directly.

**Manual Refresh**

You can manually refresh the widget by opening the script in Scriptable and running it. This bypasses iOS scheduling and fetches fresh data immediately.

**Network Dependency**

The widget requires an active internet connection to fetch data. If you're offline, it will display "N/A" for the price.

## Security and Privacy

This widget is designed with security and privacy in mind:

- No wallet connections or private key access
- No authentication required (uses public endpoints only)
- No API keys or credentials stored
- Read-only operations (cannot execute trades or modify data)
- All communication over HTTPS
- No data collection or tracking

The widget only fetches publicly available price information. It cannot access your funds, execute trades, or interact with your Hyperliquid account in any way.

## Troubleshooting

**Widget Shows "N/A" for Price**

This usually means the widget couldn't fetch data from the API. Common causes:

- No internet connection
- Hyperliquid API is temporarily unavailable
- Network timeout

Try running the script directly in Scriptable to see if there are any error messages. Check your internet connection and try again.

**Widget Not Updating**

iOS controls widget refresh timing. If your widget seems stale:

- Wait for the next automatic refresh (can take 15+ minutes)
- Manually refresh by opening the script in Scriptable
- Remove and re-add the widget to force a refresh

**Syntax Errors When Pasting Code**

If you encounter syntax errors:

- Make sure you're copying the entire file contents
- Create a fresh script rather than editing an existing one
- Check for any hidden formatting characters that might have been copied
- Verify the file encoding is correct

**Colors Not Displaying Correctly**

If colors appear wrong or hard to read:

- Check that the hex color values are properly formatted
- Ensure there's sufficient contrast between text and background colors
- The current palette is optimized for visibility on white backgrounds

## File Structure

The project consists of a few key files:

```
.
├── spot_price.js    # Main widget script
├── README.md        # This documentation
├── preview.png       # Widget screenshot
└── LICENSE          # MIT License
```

The main script file contains all the widget logic, API calls, and rendering code. Everything is contained in a single file for easy distribution and modification.

## Contributing

Contributions are welcome. If you find bugs, have feature suggestions, or want to improve the code, feel free to open an issue or submit a pull request.

When contributing:

- Follow the existing code style
- Test your changes in Scriptable before submitting
- Update documentation if you add new features
- Keep the code readable and well-commented

## Resources

For more information about the technologies and services used:

- [Hyperliquid API Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api) - Complete API reference
- [Scriptable Documentation](https://docs.scriptable.app/) - Scriptable API and widget development guide
- [Hyperliquid Web App](https://app.hyperliquid.xyz/) - Official Hyperliquid trading interface

## License

This project is licensed under the MIT License. See the LICENSE file for full details.

## Disclaimer

This widget is an independent project and is not affiliated with, endorsed by, or associated with Hyperliquid. Use at your own risk. Always verify prices and trading information on the official Hyperliquid platform before making any trading decisions. The authors and contributors are not responsible for any losses or damages resulting from the use of this widget.
