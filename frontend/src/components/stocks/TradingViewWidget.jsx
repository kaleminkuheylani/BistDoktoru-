import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget({ symbol }) {
  const container = useRef();

  useEffect(() => {
    const containerEl = container.current;
    
    // Clear previous widget
    if (containerEl) {
      containerEl.innerHTML = '';
    }

    // Create wrapper div
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [[`BIST:${symbol}|1D`]],
      "chartOnly": false,
      "width": "100%",
      "height": "100%",
      "locale": "tr",
      "colorTheme": "dark",
      "autosize": true,
      "showVolume": true,
      "showMA": false,
      "hideDateRanges": false,
      "hideMarketStatus": false,
      "hideSymbolLogo": false,
      "scalePosition": "right",
      "scaleMode": "Normal",
      "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      "fontSize": "10",
      "noTimeScale": false,
      "valuesTracking": "1",
      "changeMode": "price-and-percent",
      "chartType": "area",
      "backgroundColor": "rgba(5, 5, 5, 1)",
      "gridLineColor": "rgba(39, 39, 42, 0.5)",
      "lineWidth": 2,
      "lineType": 0,
      "dateRanges": ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"]
    });

    if (containerEl) {
      containerEl.appendChild(widgetDiv);
      containerEl.appendChild(script);
    }

    return () => {
      if (containerEl) {
        containerEl.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container w-full h-[500px] lg:h-[600px] border border-border bg-card relative overflow-hidden" data-testid="tradingview-chart">
      <div ref={container} className="w-full h-full" />
    </div>
  );
}

export default memo(TradingViewWidget);
