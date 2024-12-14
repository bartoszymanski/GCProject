let Selectors = document.querySelectorAll("form select"),
fromCurrency = document.querySelector(".from select"),
amountCurrency = document.querySelector(".amount input"),
toCurrency = document.querySelector(".to select"),
getButton = document.querySelector("form .btn-index");

for (let i = 0; i < Selectors.length; i++) {
    for(let currency_code in country_list){
        let selected = i === 0 ? currency_code === "USD" ? "selected" : "" : currency_code === "PLN" ? "selected" : "";
        let optionTag = `<option value="${currency_code}" ${selected}>${currency_code}</option>`;
        Selectors[i].insertAdjacentHTML("beforeend", optionTag);
    }
    Selectors[i].addEventListener("change", e =>{
        loadFlag(e.target);
    });
}

function loadFlag(element){
    for(let code in country_list){
        if(code === element.value){
            let flagTag = element.parentElement.querySelector("span");
            flagTag.className = `fi fi-${country_list[code]}`;
        }
    }
}
window.addEventListener("load", ()=>{
    getExchangeRate();
     var root = am5.Root.new("chartdiv_index")
    wykres(root)
});

getButton.addEventListener("click", e =>{
    e.preventDefault();
    getExchangeRate();
});

const exchangeIcon = document.querySelector("form .exchange");
exchangeIcon.addEventListener("click", e=>{
    e.preventDefault();
    let temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    loadFlag(fromCurrency);
    loadFlag(toCurrency);
    getExchangeRate();
})


function getExchangeRate(){
    const amount = document.querySelector("form input");
    const fromCurrencyTxt = document.querySelector(".from-rate");
    const exchangeRateTxt = document.querySelector(".exchange-rate");
    const showcaseTitle = document.querySelector(" .exchange-title");
    let amountVal = amountCurrency.value;

    if(amountVal === "" || amountVal === "0"){
        amount.value = "1";
        amountVal = 1;
    }
    exchangeRateTxt.innerText = "0.00";
    let url = `https://api.frankfurter.app/latest?amount=${amountVal}&from=${fromCurrency.value}&to=${toCurrency.value}`;
    fetch(url)
        .then(response => response.json())
        .then(result =>{

        let totalExRate = result.rates[toCurrency.value];
        fromCurrencyTxt.innerText = `${amountVal} ${fromCurrency.value} =`;
        exchangeRateTxt.innerText = `${parseFloat(totalExRate).toFixed(2)} ${toCurrency.value}`;
        showcaseTitle.innerHTML = `${fromCurrency.value} 
                                    <span class="fi fi-${country_list[fromCurrency.value]}"></span>
                                     <i class="fa-solid fa-arrow-right-arrow-left"></i> 
                                    ${toCurrency.value} 
                                    <span class="fi fi-${country_list[toCurrency.value]}"></span>`
    }).catch(() =>{
        exchangeRateTxt.innerHTML = "<i class=\"fa-solid fa-circle-exclamation\"></i>";
    });
}

function wykres (root) {
    root.setThemes([am5themes_Animated.new(root)]);


    var chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: false,
         panY: false,
         wheelX: "panX",
         wheelY: "zoomX",
         layout: root.verticalLayout,
        pinchZoomX:true
    }));

    chart.get("colors").set("step", 4);

    var volumeAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {
        inside: true
      }),
      height: am5.percent(30),
      layer: 5,
      numberFormat: "#a"
    }));

    volumeAxis.get("renderer").labels.template.setAll({
      centerY: am5.percent(100),
      maxPosition: 0.98
    });

   volumeAxis.axisHeader.set("paddingTop", 10);
   volumeAxis.axisHeader.children.push(am5.Label.new(root, {
      text: "CURRENCY",
      fontWeight: "bold",
      paddingTop: 5,
      paddingBottom: 5
    }));

   var dateAxis = chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
      maxDeviation: 1,
      baseInterval: { timeUnit: "day", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, {}),
      tooltip: am5.Tooltip.new(root, {})
    }));

    dateAxis.get("renderer").labels.template.setAll({
      minPosition: 0.01,
      maxPosition: 0.99
    });

    var color1 = chart.get("colors").getIndex(0);
    var color2 = chart.get("colors").getIndex(1);
    var color3 = chart.get("colors").getIndex(2);
    var color4 = chart.get("colors").getIndex(3);


    var volumeSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: "USD",
      clustered: false,
      fill: color1,
      stroke: color1,
      valueYField: "USD",
      valueXField: "date",
      xAxis: dateAxis,
      yAxis: volumeAxis,
      legendValueText: "{valueY}",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{valueY}"
      })
    }));

    var volumeSeries1 = chart.series.push(am5xy.LineSeries.new(root, {
      name: "GBP",
      clustered: false,
      fill: color2,
      stroke: color2,
      valueYField: "GBP",
      valueXField: "date",
      xAxis: dateAxis,
      yAxis: volumeAxis,
      legendValueText: "{valueY}",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{valueY}"
      })
    }));

    var volumeSeries2 = chart.series.push(am5xy.LineSeries.new(root, {
      name: "EUR",
      clustered: false,
      fill: color3,
      stroke: color3,
      valueYField: "EUR",
      valueXField: "date",
      xAxis: dateAxis,
      yAxis: volumeAxis,
      legendValueText: "{valueY}",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{valueY}"
      })
    }));

    var volumeSeries3 = chart.series.push(am5xy.LineSeries.new(root, {
      name: "CAD",
      clustered: false,
      fill: color4,
      stroke: color4,
      valueYField: "CAD",
      valueXField: "date",
      xAxis: dateAxis,
      yAxis: volumeAxis,
      legendValueText: "{valueY}",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{valueY}"
      })
    }));

    var volumeLegend = volumeAxis.axisHeader.children.push(
      am5.Legend.new(root, {
        useDefaultMarker: true
      })
    );
    volumeLegend.data.setAll([volumeSeries]);

    var volumeLegend1 = volumeAxis.axisHeader.children.push(
      am5.Legend.new(root, {
        useDefaultMarker: true
      })
    );
    volumeLegend1.data.setAll([volumeSeries1]);

    var volumeLegend2 = volumeAxis.axisHeader.children.push(
      am5.Legend.new(root, {
        useDefaultMarker: true
      })
    );
    volumeLegend2.data.setAll([volumeSeries2]);

    var volumeLegend3 = volumeAxis.axisHeader.children.push(
      am5.Legend.new(root, {
        useDefaultMarker: true
      })
    );
    volumeLegend3.data.setAll([volumeSeries3]);

    chart.leftAxesContainer.set("layout", root.verticalLayout);

    // Add cursor
    // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
    chart.set("cursor", am5xy.XYCursor.new(root, {}))

    function loadData(min, max, side) {
      min = am5.time.round(new Date(min), 1).getTime();
      var minu = new Date(min).toISOString().slice(0, 10);
      var maxu = new Date(max).toISOString().slice(0, 10);
      var url = `https://api.frankfurter.app/${minu}..${maxu}?from=PLN&to=USD,GBP,EUR,CAD`;
      // Handle loaded data
      am5.net.load(url).then(function(result) {

        // Parse loaded data
        var jsonCurrencyData = am5.JSONParser.parse(result.response)
        var data = [];
        for (const [key, value] of Object.entries(
            jsonCurrencyData["rates"]
        )) {
            pom = new Date(key.slice(0,4), parseInt(key.slice(5,7))-1, parseInt(key.slice(8,10)),0,0,0,0).getTime()
            data.push({"date":pom, "USD":value["USD"], "GBP":value["GBP"], "EUR":value["EUR"], "CAD":value["CAD"]});
        }

        var processor = am5.DataProcessor.new(root, {
            numericFields: ["date", "USD", "GBP", "EUR", "CAD"]
        });
        processor.processMany(data);

        console.log(data)

        var start = dateAxis.get("start");
        var end = dateAxis.get("end");

        // will hold first/last dates of each series
        var seriesFirst = {};
        var seriesLast = {};

        // Set data
        if (side == "none") {
          if (data.length > 0) {
            dateAxis.set("min", min);
            dateAxis.set("max", max);
            dateAxis.setPrivate("min", min);   // needed in order not to animate
            dateAxis.setPrivate("max", max);   // needed in order not to animate

            volumeSeries.data.setAll(data);
            volumeSeries1.data.setAll(data);
            volumeSeries2.data.setAll(data);
            volumeSeries3.data.setAll(data);
            dateAxis.zoom(0, 1, 0);
          }
        }
        else if (side == "left") {
          // save dates of first items so that duplicates would not be added
          seriesFirst[volumeSeries.uid] = volumeSeries.data.getIndex(0).date;
          seriesFirst[volumeSeries1.uid] = volumeSeries1.data.getIndex(0).date;
          seriesFirst[volumeSeries2.uid] = volumeSeries2.data.getIndex(0).date;
          seriesFirst[volumeSeries3.uid] = volumeSeries3.data.getIndex(0).date;
          for (var i = data.length - 1; i >= 0; i--) {
            var date = data[i].date;
            if (seriesFirst[volumeSeries.uid] > date) {
              volumeSeries.data.unshift(data[i]);
            }
            if (seriesFirst[volumeSeries1.uid] > date) {
              volumeSeries1.data.unshift(data[i]);
            }
            if (seriesFirst[volumeSeries2.uid] > date) {
              volumeSeries2.data.unshift(data[i]);
            }
            if (seriesFirst[volumeSeries3.uid] > date) {
              volumeSeries3.data.unshift(data[i]);
            }
          }

          // update axis min
          min = Math.max(min, absoluteMin);
          dateAxis.set("min", min);
          dateAxis.setPrivate("min", min); // needed in order not to animate
          // recalculate start and end so that the selection would remain
          dateAxis.set("start", 0);
          dateAxis.set("end", (end - start) / (1 - start));
        }
        else if (side == "right") {
          // save dates of last items so that duplicates would not be added
          seriesLast[volumeSeries.uid] = volumeSeries.data.getIndex(volumeSeries.data.length - 1).date;
          seriesLast[volumeSeries1.uid] = volumeSeries1.data.getIndex(volumeSeries1.data.length - 1).date;
          seriesLast[volumeSeries2.uid] = volumeSeries2.data.getIndex(volumeSeries2.data.length - 1).date;
          seriesLast[volumeSeries3.uid] = volumeSeries3.data.getIndex(volumeSeries3.data.length - 1).date;

          for (var i = 0; i < data.length; i++) {
            var date = data[i].date;
            // only add if last items date is smaller then newly added items date
            if (seriesLast[volumeSeries.uid] < date) {
              volumeSeries.data.push(data[i]);
            }
            if (seriesLast[volumeSeries1.uid] < date) {
              volumeSeries1.data.push(data[i]);
            }
            if (seriesLast[volumeSeries2.uid] < date) {
              volumeSeries2.data.push(data[i]);
            }
            if (seriesLast[volumeSeries3.uid] < date) {
              volumeSeries3.data.push(data[i]);
            }
          }
          // update axis max
          max = Math.min(max, absoluteMax);
          dateAxis.set("max", max);
          dateAxis.setPrivate("max", max); // needed in order not to animate

          // recalculate start and end so that the selection would remain
          dateAxis.set("start", start / end);
          dateAxis.set("end", 1);
        }
      });
    }

    function loadSomeData() {
      var start = dateAxis.get("start");
      var end = dateAxis.get("end");

      var selectionMin = Math.max(dateAxis.getPrivate("selectionMin"), absoluteMin);
      var selectionMax = Math.min(dateAxis.getPrivate("selectionMax"), absoluteMax);

      var min = dateAxis.getPrivate("min");
      var max = dateAxis.getPrivate("max");

      // if start is less than 0, means we are panning to the right, need to load data to the left (earlier days)
      if (start < 0) {
        loadData(selectionMin, min, "left");
      }
      // if end is bigger than 1, means we are panning to the left, need to load data to the right (later days)
      if (end > 1) {
        loadData(max, selectionMax, "right");
      }
    }

    var currentDate = new Date();
    if(currentDate.getHours() < 16)
        currentDate.setDate(currentDate.getDate() - 1)
    // initially load 50 days
    var dzien = currentDate.getDay()
    if(dzien == 0){ dzien = 7}
    while(dzien > 5){
        currentDate.setDate(currentDate.getDate() - 1)
        max = currentDate.getTime()
        dzien--
    }
    var min = currentDate.getTime() - am5.time.getDuration("day", 50);
    var max = currentDate.getTime()
    // limit to the data's extremes
    var absoluteMax = max;
    var absoluteMin = new Date(1999, 0, 4, 16, 0, 0, 0);

    // load data when panning ends
    chart.events.on("panended", function() {
      loadSomeData();
    });


    var wheelTimeout;
    chart.events.on("wheelended", function() {
      // load data with some delay when wheel ends, as this is event is fired a lot
      // if we already set timeout for loading, dispose it
      if (wheelTimeout) {
        wheelTimeout.dispose();
      }

      wheelTimeout = chart.setTimeout(function() {
        loadSomeData();
      }, 50);
    });

    // load some initial data
    loadData(min, max, "none");

    chart.appear(1000, 500);
}