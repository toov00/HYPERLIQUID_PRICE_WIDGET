# HYPE/USDC Spot Price Widget

A simple iOS widget that displays the current HYPE/USDC spot price from Hyperliquid, built with [Scriptable](https://scriptable.app/).

![Widget Preview](preview.png)

## Features

- **HYPE/USDC spot price** from Hyperliquid's L1
- **24-hour price change** with color indicator
- **Last updated timestamp**
- Clean, dark theme matching Hyperliquid's UI
- Small, medium, and large widget sizes supported

## Requirements

- iPhone running iOS 14+
- [Scriptable app](https://apps.apple.com/app/scriptable/id1405459188) (free)

## Installation

1. Download and install **Scriptable** from the App Store
2. Open Scriptable and tap **+** to create a new script
3. Copy the contents of `hype-spot-widget.js` into the script
4. Tap the title to rename it (e.g., "HYPE Price")
5. Tap **Done**

### Adding to Home Screen

1. Long-press on your home screen
2. Tap **+** in the top corner
3. Search for **Scriptable**
4. Choose your preferred widget size
5. Tap **Add Widget**
6. Long-press the widget and tap **Edit Widget**
7. Select your "HYPE Price" script

## Configuration

Edit these values at the top of the script to customize:

```javascript
// Change colors
var COLORS = {
  bg: new Color('#0d0d0d'),      // Background
  card: new Color('#1a1a1a'),    // Card background
  green: new Color('#00ff88'),   // Positive change
  red: new Color('#ff4d4d'),     // Negative change
  white: new Color('#ffffff'),   // Primary text
  gray: new Color('#888888')     // Secondary text
};
```

### Other Spot Pairs

To track a different spot pair, change the `@107` identifier:

```javascript
// Find your pair's index in Hyperliquid's spotMeta response
// Examples:
// HYPE/USDC = @107
// PURR/USDC = PURR/USDC (special case)
```

## How It Works

The widget fetches data from Hyperliquid's public Info API:

| Endpoint | Purpose |
|----------|---------|
| `POST /info` with `type: allMids` | Current spot prices |
| `POST /info` with `type: candleSnapshot` | 24h price data |

### API Details

- **Base URL:** `https://api.hyperliquid.xyz/info`
- **Method:** POST
- **Auth:** None required (public endpoint)
- **Rate Limit:** Reasonable for widget use

Spot assets use the `@{index}` format where `index` comes from the `spotMeta` response. HYPE/USDC is `@107` on mainnet.

## Limitations

- **iOS controls refresh rate** - Widgets typically update every 15+ minutes
- **No real-time updates** - This is an iOS limitation, not the widget
- **Tap to refresh** - Opening the widget in Scriptable fetches fresh data

## Security

This widget is **read-only** and safe to use:

- No wallet connection
- No private keys
- No API keys required
- No authentication
- Public endpoint only
- HTTPS encrypted

The widget only fetches publicly available price data. It cannot access your funds or sign transactions.

## File Structure

```
.
├── hype-spot-widget.js    # Main widget script
├── README.md              # This file
├── LICENSE                # MIT License
└── preview.png            # Widget screenshot
```

## Troubleshooting

### Widget shows "N/A"
- Check your internet connection
- Hyperliquid API may be temporarily unavailable
- Run the script directly in Scriptable to see error logs

### Widget not updating
- iOS widgets refresh every ~15 minutes (Apple limitation)
- Force refresh by running the script in Scriptable
- Remove and re-add the widget

### Syntax error on paste
- Make sure you're copying the raw file contents
- Create a fresh script (don't edit an existing one)
- Check for any copied formatting characters

## Contributing

Contributions welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## Resources

- [Hyperliquid API Docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api)
- [Scriptable Docs](https://docs.scriptable.app/)
- [Hyperliquid App](https://app.hyperliquid.xyz/)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Disclaimer

This widget is not affiliated with Hyperliquid. Use at your own risk. Always verify prices on the official platform before making trading decisions.

---

