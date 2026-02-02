// HYPE/USDC Spot Price Widget with Price Alerts for Hyperliquid

// ============================================================================
// NOTIFICATION CONFIGURATION: CUSTOMIZE YOUR ALERTS HERE
// ============================================================================

var ALERTS = {
    enabled: true,                    // Master switch for all alerts
    
    // Price threshold alerts
    priceAlerts: {
      enabled: true,
      upperThreshold: 30.00,          // Alert when price goes ABOVE this
      lowerThreshold: 20.00,          // Alert when price goes BELOW this
    },
    
    // 24-hour change alerts
    changeAlerts: {
      enabled: true,
      positivePercent: 10,            // Alert if price up more than 10%
      negativePercent: -10            // Alert if price down more than 10%
    },
    
    // Cooldown to prevent spam (minutes)
    cooldownMinutes: 15
  };
  
  // ============================================================================
  // Configuration
  // ============================================================================
  
  // Trading pair identifiers
  var SPOT_PAIRS = {
    'HYPE': '@107',
    'PURR': 'PURR/USDC'
  };
  
  // Color palette
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
  
  // Custom image configuration
  var CUSTOM_IMAGE_URL = null;
  var CUSTOM_IMAGE_LOCAL = null;
  
  // Layout options
  var USE_GRADIENT_BG = false;
  var USE_CARD_LAYOUT = true;
  
  // API configuration
  var API_BASE_URL = 'https://api.hyperliquid.xyz/info';
  var HYPE_PAIR_ID = '@107';
  var MILLISECONDS_PER_DAY = 86400000;
  
  // Widget styling constants
  var CARD_CORNER_RADIUS = 16;
  var CARD_PADDING = 16;
  var WIDGET_PADDING = 12;
  var CONTENT_SPACING = 8;
  
  // Storage keys
  var STORAGE_KEYS = {
    lastAlertTime: 'hype_last_alert_time',
    lastAlertType: 'hype_last_alert_type',
    lastAlertPrice: 'hype_last_alert_price'
  };
  
  // ============================================================================
  // Storage Functions
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
        return 999; // Return large number if error
      }
    }
    return 999; // Return large number if no previous alert
  }
  
  // ============================================================================
  // API Functions
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
  // Notification Functions
  // ============================================================================
  
  function sendNotification(title, body) {
    if (!ALERTS.enabled) return;
    
    var notification = new Notification();
    notification.title = title;
    notification.body = body;
    notification.sound = 'default';
    notification.schedule();
    
    // Save alert timestamp
    saveData(STORAGE_KEYS.lastAlertTime, Date.now());
    
    console.log('Notification sent: ' + title);
  }
  
  function checkPriceAlerts(currentPrice) {
    if (!ALERTS.enabled || !ALERTS.priceAlerts.enabled || currentPrice === null) {
      return;
    }
    
    // Check cooldown
    var minutesSinceLastAlert = getTimeSinceLastAlert();
    if (minutesSinceLastAlert < ALERTS.cooldownMinutes) {
      console.log('Alert cooldown active (' + minutesSinceLastAlert.toFixed(1) + ' min since last alert)');
      return;
    }
    
    var lastAlertType = loadData(STORAGE_KEYS.lastAlertType);
    var lastAlertPrice = loadData(STORAGE_KEYS.lastAlertPrice);
    
    // Check if price crossed ABOVE upper threshold
    if (currentPrice >= ALERTS.priceAlerts.upperThreshold) {
      // Only alert if this is a new threshold cross or different from last alert
      if (lastAlertType !== 'upper' || lastAlertPrice !== ALERTS.priceAlerts.upperThreshold) {
        sendNotification(
          'HYPE Price Alert: Above Threshold!',
          'HYPE reached $' + currentPrice.toFixed(4) + ' (above $' + ALERTS.priceAlerts.upperThreshold.toFixed(2) + ' threshold)'
        );
        saveData(STORAGE_KEYS.lastAlertType, 'upper');
        saveData(STORAGE_KEYS.lastAlertPrice, ALERTS.priceAlerts.upperThreshold);
      }
    }
    // Check if price crossed BELOW lower threshold
    else if (currentPrice <= ALERTS.priceAlerts.lowerThreshold) {
      // Only alert if this is a new threshold cross or different from last alert
      if (lastAlertType !== 'lower' || lastAlertPrice !== ALERTS.priceAlerts.lowerThreshold) {
        sendNotification(
          'HYPE Price Alert: Below Threshold!',
          'HYPE dropped to $' + currentPrice.toFixed(4) + ' (below $' + ALERTS.priceAlerts.lowerThreshold.toFixed(2) + ' threshold)'
        );
        saveData(STORAGE_KEYS.lastAlertType, 'lower');
        saveData(STORAGE_KEYS.lastAlertPrice, ALERTS.priceAlerts.lowerThreshold);
      }
    }
    // Price is in normal range: reset alert type so next threshold cross will trigger
    else {
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
    
    // Check cooldown
    var minutesSinceLastAlert = getTimeSinceLastAlert();
    if (minutesSinceLastAlert < ALERTS.cooldownMinutes) {
      return;
    }
    
    var lastAlertType = loadData(STORAGE_KEYS.lastAlertType);
    
    // Check for large positive change
    if (change >= ALERTS.changeAlerts.positivePercent) {
      if (lastAlertType !== 'change_positive') {
        sendNotification(
          'HYPE 24h Surge!',
          'HYPE is up ' + change.toFixed(2) + '% in the last 24 hours!'
        );
        saveData(STORAGE_KEYS.lastAlertType, 'change_positive');
      }
    }
    // Check for large negative change
    else if (change <= ALERTS.changeAlerts.negativePercent) {
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
  // Image Loading
  // ============================================================================
  
  /**
   * Attempts to load custom image from URL or local file
   * @returns {Image|null} Image object or null if not found
   */
  async function loadCustomImage() {
    // Try remote URL first
    if (CUSTOM_IMAGE_URL) {
      try {
        var request = new Request(CUSTOM_IMAGE_URL);
        var image = await request.loadImage();
        if (image) {
          return image;
        }
      } catch (error) {
        console.log('Failed to load image from URL: ' + error);
      }
    }
    
    // Try local file
    if (CUSTOM_IMAGE_LOCAL) {
      try {
        var fileManager = FileManager.iCloud();
        var imagePath = fileManager.joinPath(
          fileManager.documentsDirectory(),
          CUSTOM_IMAGE_LOCAL
        );
        
        if (fileManager.fileExists(imagePath)) {
          var image = fileManager.readImage(imagePath);
          if (image) {
            return image;
          }
        }
      } catch (error) {
        console.log('Failed to load local image: ' + error);
      }
    }
    
    return null;
  }
  
  // ============================================================================
  // Widget Building
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
      
      // Create card container
      var cardContainer = widget.addStack();
      cardContainer.backgroundColor = COLORS.card;
      cardContainer.cornerRadius = CARD_CORNER_RADIUS;
      cardContainer.setPadding(
        CARD_PADDING,
        CARD_PADDING,
        CARD_PADDING,
        CARD_PADDING
      );
      
      // Main content stack
      var contentStack = cardContainer.addStack();
      contentStack.layoutVertically();
      contentStack.spacing = CONTENT_SPACING;
      
      // Trading pair label
      var pairLabel = contentStack.addText('HYPE/USDC');
      pairLabel.font = Font.semiboldSystemFont(14);
      pairLabel.textColor = COLORS.text;
      
      // Price display
      var priceText = contentStack.addText(formatPrice(price));
      priceText.font = Font.boldSystemFont(24);
      priceText.textColor = COLORS.price;
      
      // 24h change display
      if (change !== null && !isNaN(change)) {
        var changeText = contentStack.addText(formatChange(change));
        changeText.font = Font.semiboldSystemFont(11);
        changeText.textColor = change >= 0 ? COLORS.green : COLORS.red;
      }
      
      // Alert status indicator (if alerts are enabled)
      /*if (ALERTS.enabled) {
        contentStack.addSpacer(1);
        var alertStatus = 'Alerts: ';
        if (price !== null) {
          if (price >= ALERTS.priceAlerts.upperThreshold) {
            alertStatus += 'Above $' + ALERTS.priceAlerts.upperThreshold;
          } else if (price <= ALERTS.priceAlerts.lowerThreshold) {
            alertStatus += 'Below $' + ALERTS.priceAlerts.lowerThreshold;
          } else {
            alertStatus += '$' + ALERTS.priceAlerts.lowerThreshold + ' : $' + ALERTS.priceAlerts.upperThreshold;
          }
        } else {
          alertStatus += 'Active';
        }
        
        var alertText = contentStack.addText(alertStatus);
        alertText.font = Font.regularSystemFont(8);
        alertText.textColor = COLORS.secondary;
      }
      */
      // Update timestamp
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
  // Main Execution
  // ============================================================================
  
  /**
   * Main function that orchestrates data fetching and widget creation
   */
  async function main() {
    try {
      // Fetch data
      var prices = await getSpotPrice();
      var change = await get24hChange();
      
      // Extract HYPE price
      var hypePrice = null;
      if (prices && prices[HYPE_PAIR_ID]) {
        hypePrice = parseFloat(prices[HYPE_PAIR_ID]);
      }
      
      // Check for alerts
      if (hypePrice !== null) {
        checkPriceAlerts(hypePrice);
        check24hChangeAlerts(change);
      }
      
      // Build and display widget
      var widget = await buildWidget(hypePrice, change);
      
      // Present widget based on context
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
  
  // Run main function
  main();