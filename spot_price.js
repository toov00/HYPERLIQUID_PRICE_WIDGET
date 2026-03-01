// ============================================================================
// NOTIFICATION CONFIGURATION: CUSTOMIZE YOUR ALERTS HERE
// ============================================================================

var ALERTS = {
  enabled: true,                    // Master switch for all alerts
  
  priceAlerts: {
    enabled: true,
    upperThreshold: 30.00,          // Alerts when price goes above this
    lowerThreshold: 20.00           // Alerts when price goes below this
  },
  
  changeAlerts: {
    enabled: true,
    positivePercent: 10,            // Alerts if price goes up by more than 10%
    negativePercent: -10            // Alerts if price goes down by more than 10%
  },
  
  cooldownMinutes: 15
};

// ============================================================================
// STYLING CONFIGURATION: CUSTOMIZE THE INTERFACE HERE
// ============================================================================

var COLORS = {
  'bg': new Color('#544C4A'),           // Brownish dark gray background
  'card': new Color('#FFFFFF'),         // White card
  'green': new Color('#059669'),         // Green for positive changes
  'red': new Color('#DC2626'),          // Red for negative changes
  'text': new Color('#D3D3D3'),         // Light gray text
  'accent': new Color('#E5E7EB'),       // Light gray accent
  'price': new Color('#544C4A'),         // Brownish dark gray for price
  'secondary': new Color('#D3D3D3')     // Light gray for secondary text
};

// Layout options
var USE_GRADIENT_BG = false;
var USE_CARD_LAYOUT = true;

// Widget styling constants
var CARD_CORNER_RADIUS = 16;
var CARD_PADDING = 16;
var WIDGET_PADDING = 12;
var CONTENT_SPACING = 8;

// ============================================================================
// OTHER GLOBAL VARIABLES
// ============================================================================

var API_BASE_URL = 'https://api.hyperliquid.xyz/info';
var HYPE_PAIR_ID = '@107';
var MILLISECONDS_PER_DAY = 86400000;

var SPOT_PAIRS = {
  'HYPE': '@107'
};

var STORAGE_KEYS = {
  lastAlertTime: 'hype_last_alert_time',
  lastAlertType: 'hype_last_alert_type',
  lastAlertPrice: 'hype_last_alert_price'
};

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

function saveData(key, value) {
  var fm = FileManager.local();
  var path = fm.joinPath(fm.documentsDirectory(), 'hype_widget_' + key + '.json');
  fm.writeString(path, JSON.stringify({value: value, timestamp: Date.now()}));
}

function loadData(key) {
  var fm = FileManager.local();
  var path = fm.joinPath(fm.documentsDirectory(), 'hype_widget_' + key + '.json');
  
  if (fm.fileExists(path)) {
    try {
      var content = fm.readString(path);
      var data = JSON.parse(content);
      return data.value;
    } catch (error) {
      console.log('Error loading data for key: ' + key);
      return null;
    }
  }
  return null;
}

function getTimeSinceLastAlert() {
  var fm = FileManager.local();
  var path = fm.joinPath(fm.documentsDirectory(), 'hype_widget_' + STORAGE_KEYS.lastAlertTime + '.json');
  
  if (fm.fileExists(path)) {
    try {
      var content = fm.readString(path);
      var data = JSON.parse(content);
      var lastTime = data.timestamp;
      var minutesSince = (Date.now() - lastTime) / (1000 * 60);
      return minutesSince;
    } catch (error) {
      return 999; 
    }
  }
  return 999; 
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetches current spot prices from Hyperliquid API
 * @returns {Object|null} Price data object or null on error
 */
async function getSpotPrice() {
  var request = new Request(API_BASE_URL);
  request.method = 'POST';
  request.headers = { 'Content-Type': 'application/json' };
  request.body = JSON.stringify({ type: 'allMids' });
  
  try {
    var response = await request.loadJSON();
    return response;
  } catch (error) {
    console.log('Failed to fetch spot prices: ' + error);
    return null;
  }
}

/**
 * Calculates 24-hour price change percentage
 * @returns {number|null} Percentage change or null on error
 */
async function get24hChange() {
  var now = Date.now();
  var oneDayAgo = now - MILLISECONDS_PER_DAY;
  
  var request = new Request(API_BASE_URL);
  request.method = 'POST';
  request.headers = { 'Content-Type': 'application/json' };
  request.body = JSON.stringify({
    type: 'candleSnapshot',
    req: {
      coin: HYPE_PAIR_ID,
      interval: '1d',
      startTime: oneDayAgo,
      endTime: now
    }
  });
  
  try {
    var candles = await request.loadJSON();
    if (!candles || candles.length === 0) {
      return null;
    }
    
    var latestCandle = candles[candles.length - 1];
    var openPrice = parseFloat(latestCandle.o);
    var closePrice = parseFloat(latestCandle.c);
    
    if (isNaN(openPrice) || isNaN(closePrice) || openPrice === 0) {
      return null;
    }
    
    var changePercent = ((closePrice - openPrice) / openPrice) * 100;
    return changePercent;
  } catch (error) {
    console.log('Failed to fetch 24h change: ' + error);
    return null;
  }
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

function sendNotification(title, body) {
  if (!ALERTS.enabled) return;
  
  var notification = new Notification();
  notification.title = title;
  notification.body = body;
  notification.sound = 'default';
  notification.schedule();
  
  saveData(STORAGE_KEYS.lastAlertTime, Date.now());
  console.log('Notification sent: ' + title);
}

function checkPriceAlerts(currentPrice) {
  if (!ALERTS.enabled || !ALERTS.priceAlerts.enabled || currentPrice === null) {
    return;
  }
  
  var minutesSinceLastAlert = getTimeSinceLastAlert();
  if (minutesSinceLastAlert < ALERTS.cooldownMinutes) {
    console.log('Alert cooldown active (' + minutesSinceLastAlert.toFixed(1) + ' min since last alert)');
    return;
  }
  
  var lastAlertType = loadData(STORAGE_KEYS.lastAlertType);
  var lastAlertPrice = loadData(STORAGE_KEYS.lastAlertPrice);
  
  if (currentPrice >= ALERTS.priceAlerts.upperThreshold) {
    if (lastAlertType !== 'upper' || lastAlertPrice !== ALERTS.priceAlerts.upperThreshold) {
      sendNotification(
        'HYPE Price Alert: Above Threshold!',
        'HYPE reached $' + currentPrice.toFixed(4) + ' (above $' + ALERTS.priceAlerts.upperThreshold.toFixed(2) + ' threshold)'
      );
      saveData(STORAGE_KEYS.lastAlertType, 'upper');
      saveData(STORAGE_KEYS.lastAlertPrice, ALERTS.priceAlerts.upperThreshold);
    }
  } else if (currentPrice <= ALERTS.priceAlerts.lowerThreshold) {
    if (lastAlertType !== 'lower' || lastAlertPrice !== ALERTS.priceAlerts.lowerThreshold) {
      sendNotification(
        'HYPE Price Alert: Below Threshold!',
        'HYPE dropped to $' + currentPrice.toFixed(4) + ' (below $' + ALERTS.priceAlerts.lowerThreshold.toFixed(2) + ' threshold)'
      );
      saveData(STORAGE_KEYS.lastAlertType, 'lower');
      saveData(STORAGE_KEYS.lastAlertPrice, ALERTS.priceAlerts.lowerThreshold);
    }
  } else {
    if (lastAlertType !== 'normal') {
      console.log('Price back in normal range: $' + currentPrice.toFixed(4));
      saveData(STORAGE_KEYS.lastAlertType, 'normal');
    }
  }
}

function check24hChangeAlerts(change) {
  if (!ALERTS.enabled || !ALERTS.changeAlerts.enabled || change === null) {
    return;
  }
  
  var minutesSinceLastAlert = getTimeSinceLastAlert();
  if (minutesSinceLastAlert < ALERTS.cooldownMinutes) {
    return;
  }
  
  var lastAlertType = loadData(STORAGE_KEYS.lastAlertType);
  
  if (change >= ALERTS.changeAlerts.positivePercent) {
    if (lastAlertType !== 'change_positive') {
      sendNotification(
        'HYPE 24h Surge!',
        'HYPE is up ' + change.toFixed(2) + '% in the last 24 hours!'
      );
      saveData(STORAGE_KEYS.lastAlertType, 'change_positive');
    }
  } else if (change <= ALERTS.changeAlerts.negativePercent) {
    if (lastAlertType !== 'change_negative') {
      sendNotification(
        'HYPE 24h Drop Alert',
        'HYPE is down ' + Math.abs(change).toFixed(2) + '% in the last 24 hours'
      );
      saveData(STORAGE_KEYS.lastAlertType, 'change_negative');
    }
  }
}

// ============================================================================
// WIDGET BUILDING FUNCTIONS
// ============================================================================

/**
 * Formats price string with dollar sign and 4 decimal places
 * @param {number|null} price: Price value
 * @returns {string} Formatted price string
 */
function formatPrice(price) {
  if (price === null || price === undefined || isNaN(price)) {
    return 'N/A';
  }
  return '$' + parseFloat(price).toFixed(4);
}

/**
 * Formats 24h change percentage with sign
 * @param {number} change: Percentage change value
 * @returns {string} Formatted change string
 */
function formatChange(change) {
  var sign = change >= 0 ? '+' : '';
  return sign + change.toFixed(2) + '% (24h)';
}

/**
 * Formats current time as HH:MM
 * @returns {string} Formatted time string
 */
function formatUpdateTime() {
  var now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Creates error widget for display when something goes wrong
 * @param {string} message: Error message to display
 * @returns {ListWidget} Error widget
 */
function createErrorWidget(message) {
  var widget = new ListWidget();
  widget.backgroundColor = COLORS.bg;
  widget.setPadding(CARD_PADDING, CARD_PADDING, CARD_PADDING, CARD_PADDING);
  
  var errorText = widget.addText(message);
  errorText.textColor = COLORS.text;
  errorText.font = Font.regularSystemFont(12);
  
  return widget;
}

/**
 * Builds the main widget with price and change data
 * @param {number|null} price: Current price
 * @param {number|null} change: 24h change percentage
 * @returns {ListWidget} Configured widget
 */
async function buildWidget(price, change) {
  try {
    var widget = new ListWidget();
    widget.backgroundColor = COLORS.bg;
    widget.setPadding(WIDGET_PADDING, WIDGET_PADDING, WIDGET_PADDING, WIDGET_PADDING);
    
    var scriptName = Script.name();
    widget.url = 'scriptable:///run?scriptName=' + encodeURIComponent(scriptName);
    
    var cardContainer = widget.addStack();
    cardContainer.backgroundColor = COLORS.card;
    cardContainer.cornerRadius = CARD_CORNER_RADIUS;
    cardContainer.setPadding(
      CARD_PADDING,
      CARD_PADDING,
      CARD_PADDING,
      CARD_PADDING
    );
    
    var contentStack = cardContainer.addStack();
    contentStack.layoutVertically();
    contentStack.spacing = CONTENT_SPACING;
    
    var pairLabel = contentStack.addText('HYPE/USDC');
    pairLabel.font = Font.semiboldSystemFont(14);
    pairLabel.textColor = COLORS.text;
    
    var priceText = contentStack.addText(formatPrice(price));
    priceText.font = Font.boldSystemFont(24);
    priceText.textColor = COLORS.price;
    
    if (change !== null && !isNaN(change)) {
      var changeText = contentStack.addText(formatChange(change));
      changeText.font = Font.semiboldSystemFont(11);
      changeText.textColor = change >= 0 ? COLORS.green : COLORS.red;
    }
    
    contentStack.addSpacer(1);
    var timeLabel = contentStack.addText('Updated ' + formatUpdateTime());
    timeLabel.font = Font.regularSystemFont(9);
    timeLabel.textColor = COLORS.secondary;
    
    return widget;
  } catch (error) {
    console.log('Error building widget: ' + error);
    return createErrorWidget('Error loading widget');
  }
}

// ============================================================================
// MAIN EXECUTION FUNCTION
// ============================================================================

/**
 * Main function that orchestrates data fetching and widget creation
 */
async function main() {
  try {
    var prices = await getSpotPrice();
    var change = await get24hChange();
    
    var hypePrice = null;
    if (prices && prices[HYPE_PAIR_ID]) {
      hypePrice = parseFloat(prices[HYPE_PAIR_ID]);
    }
    
    if (hypePrice !== null) {
      checkPriceAlerts(hypePrice);
      check24hChangeAlerts(change);
    }
    
    var widget = await buildWidget(hypePrice, change);
    
    var isWidgetContext = typeof config !== 'undefined' && config.runsInWidget;
    if (isWidgetContext) {
      Script.setWidget(widget);
    } else {
      await widget.presentSmall();
    }
    
    Script.complete();
  } catch (error) {
    console.log('Fatal error: ' + error);
    var errorWidget = createErrorWidget('Error: ' + error.message);
    
    var isWidgetContext = typeof config !== 'undefined' && config.runsInWidget;
    if (isWidgetContext) {
      Script.setWidget(errorWidget);
    } else {
      await errorWidget.presentSmall();
    }
    
    Script.complete();
  }
}

main();
  