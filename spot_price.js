// HYPE/USDC Spot Price Widget for Hyperliquid

var SPOT_PAIRS = {
  'HYPE': '@107',
  'PURR': 'PURR/USDC'
};

var COLORS = {
  bg: new Color('#0d0d0d'),
  card: new Color('#1a1a1a'),
  green: new Color('#00ff88'),
  red: new Color('#ff4d4d'),
  white: new Color('#ffffff'),
  gray: new Color('#888888')
};

async function getSpotPrice() {
  var req = new Request('https://api.hyperliquid.xyz/info');
  req.method = 'POST';
  req.headers = { 'Content-Type': 'application/json' };
  req.body = JSON.stringify({ type: 'allMids' });
  try {
    var res = await req.loadJSON();
    return res;
  } catch (e) {
    return null;
  }
}

async function get24hChange() {
  var req = new Request('https://api.hyperliquid.xyz/info');
  req.method = 'POST';
  req.headers = { 'Content-Type': 'application/json' };
  req.body = JSON.stringify({
    type: 'candleSnapshot',
    req: {
      coin: '@107',
      interval: '1d',
      startTime: Date.now() - 86400000,
      endTime: Date.now()
    }
  });
  try {
    var candles = await req.loadJSON();
    if (candles && candles.length > 0) {
      var c = candles[candles.length - 1];
      var open = parseFloat(c.o);
      var close = parseFloat(c.c);
      return ((close - open) / open) * 100;
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function buildWidget(price, change) {
  var w = new ListWidget();
  w.backgroundColor = COLORS.bg;
  w.setPadding(16, 16, 16, 16);
  
  // Header
  var header = w.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  
  var logo = header.addText('HYPERLIQUID');
  logo.font = Font.boldSystemFont(10);
  logo.textColor = COLORS.green;
  
  header.addSpacer();
  
  var spot = header.addText('SPOT');
  spot.font = Font.boldSystemFont(8);
  spot.textColor = COLORS.gray;
  
  w.addSpacer(12);
  
  // Pair name
  var pair = w.addText('HYPE/USDC');
  pair.font = Font.boldSystemFont(18);
  pair.textColor = COLORS.white;
  
  w.addSpacer(4);
  
  // Price
  var priceStr = price ? ('$' + parseFloat(price).toFixed(4)) : 'N/A';
  var priceText = w.addText(priceStr);
  priceText.font = Font.boldSystemFont(28);
  priceText.textColor = COLORS.white;
  
  w.addSpacer(4);
  
  // 24h change
  if (change !== null) {
    var sign = change >= 0 ? '+' : '';
    var changeStr = sign + change.toFixed(2) + '% (24h)';
    var changeText = w.addText(changeStr);
    changeText.font = Font.semiboldSystemFont(14);
    changeText.textColor = change >= 0 ? COLORS.green : COLORS.red;
  }
  
  w.addSpacer();
  
  // Updated time
  var now = new Date();
  var timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  var timeText = w.addText('Updated ' + timeStr);
  timeText.font = Font.systemFont(9);
  timeText.textColor = COLORS.gray;
  
  return w;
}

async function main() {
  var prices = await getSpotPrice();
  var change = await get24hChange();
  
  var hypePrice = null;
  if (prices && prices['@107']) {
    hypePrice = prices['@107'];
  }
  
  var widget = await buildWidget(hypePrice, change);
  
  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    widget.presentSmall();
  }
  Script.complete();
}

main();
