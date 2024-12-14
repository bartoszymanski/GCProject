const SelectGraph = document.querySelectorAll("form select"),
graphButton = document.querySelector("form .btn-index");
fromCurrency = document.querySelector(".from select"),
toCurrency = document.querySelector(".to select");

for (let i = 0; i < SelectGraph.length; i++) {
    for(let currency_code in country_list){
        let selected = i === 0 ? currency_code === "USD" ? "selected" : "" : currency_code === "PLN" ? "selected" : "";
        let optionTag = `<option value="${currency_code}" ${selected}>${currency_code}</option>`;
        SelectGraph[i].insertAdjacentHTML("beforeend", optionTag);
    }
    SelectGraph[i].addEventListener("change", e =>{
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

var roots = []

window.addEventListener("load", ()=>{
    var root = am5.Root.new("chartdiv")
    roots.push(root)
    wykres(root)
});

graphButton.addEventListener("click", e =>{
    e.preventDefault();
    zmiana()
});

const exchangeIcon = document.querySelector("form .exchange");
exchangeIcon.addEventListener("click", e=>{
    e.preventDefault();
    let temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    loadFlag(fromCurrency);
    loadFlag(toCurrency);
    zmiana()
})

function zmiana(){
    const TitleTxt = document.querySelector(".title-graph h4");
    TitleTxt.innerText = `1.00 ${fromCurrency.value} =`
    roots[0].dispose()
    roots.shift()
    var root = am5.Root.new("chartdiv")
    roots.push(root)
    wykres(root)
}

function wykres (root) {
    if(fromCurrency.value == toCurrency.value){
        alert("NIE WOLNO")
        fromCurrency.value = "USD"
        toCurrency.value = "PLN"
        loadFlag(fromCurrency);
        loadFlag(toCurrency);
        const TitleTxt = document.querySelector(".title-graph h4");
        TitleTxt.innerText = `1.00 ${fromCurrency.value} =`
    }
    root.setThemes([am5themes_Animated.new(root)]);
    var chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        layout: root.verticalLayout,
        pinchZoomX: true
    }));

    chart.get("colors").set("step", 2);

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

    var dateAxis = chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
        maxDeviation: 1,
        baseInterval: {timeUnit: "day", count: 1},
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {})
    }));

    dateAxis.get("renderer").labels.template.setAll({
        minPosition: 0.01,
        maxPosition: 0.99
    });

    var firstColor = chart.get("colors").getIndex(0);

    var volumeSeries = chart.series.push(am5xy.LineSeries.new(root, {
        clustered: false,
        fill: firstColor,
        stroke: firstColor,
        valueYField: "value",
        valueXField: "date",
        xAxis: dateAxis,
        yAxis: volumeAxis,
        legendValueText: "{valueY}",
        tooltip: am5.Tooltip.new(root, {
            labelText: "{valueY}"
        })
    }));

    chart.leftAxesContainer.set("layout", root.verticalLayout);


    // Add cursor
    // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
    chart.set("cursor", am5xy.XYCursor.new(root, {}))


    // Add scrollbar
    // https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
    var scrollbar = chart.set("scrollbarX", am5xy.XYChartScrollbar.new(root, {
        orientation: "horizontal",
        height: 50
    }));

    var sbDateAxis = scrollbar.chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
        baseInterval: {
            timeUnit: "day",
            count: 1
        },
        renderer: am5xy.AxisRendererX.new(root, {})
    }));

    var sbVolumeAxis = scrollbar.chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererY.new(root, {})
        })
    );

    var sbSeries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {

        valueYField: "value",
        valueXField: "date",
        xAxis: sbDateAxis,
        yAxis: sbVolumeAxis
    }));

    sbSeries.fills.template.setAll({
        visible: true,
        fillOpacity: 0.3
    });

    function loadData(min, max, side) {
        min = am5.time.round(new Date(min), 1).getTime();
        var minu = new Date(min).toISOString().slice(0, 10);
        var maxu = new Date(max).toISOString().slice(0, 10);
        console.log(maxu)
        var url = `https://api.frankfurter.app/${minu}..${maxu}?from=${fromCurrency.value}&to=${toCurrency.value}`;
        // Handle loaded data
        am5.net.load(url).then(function (result) {

            // Parse loaded data
            var jsonCurrencyData = am5.JSONParser.parse(result.response)
            var data = [];
            for (const [key, value] of Object.entries(
                jsonCurrencyData["rates"]
            )) {
                pom = new Date(key.slice(0, 4), parseInt(key.slice(5, 7)) - 1, parseInt(key.slice(8, 10)), 0, 0, 0, 0).getTime()
                data.push({"date": pom, "value": value[toCurrency.value]});
            }

            var processor = am5.DataProcessor.new(root, {
                numericFields: ["date", "value"]
            });
            processor.processMany(data);
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
                    sbSeries.data.setAll(data);
                    dateAxis.zoom(0, 1, 0);
                }
            } else if (side == "left") {
                // save dates of first items so that duplicates would not be added
                seriesFirst[volumeSeries.uid] = volumeSeries.data.getIndex(0).date;
                seriesFirst[sbSeries.uid] = sbSeries.data.getIndex(0).date;
                for (var i = data.length - 1; i >= 0; i--) {
                    var date = data[i].date;
                    // only add if first items date is bigger then newly added items date
                    if (seriesFirst[volumeSeries.uid] > date) {
                        volumeSeries.data.unshift(data[i]);
                    }
                    if (seriesFirst[sbSeries.uid] > date) {
                        sbSeries.data.unshift(data[i]);
                    }
                }

                // update axis min
                min = Math.max(min, absoluteMin);
                dateAxis.set("min", min);
                dateAxis.setPrivate("min", min); // needed in order not to animate
                // recalculate start and end so that the selection would remain
                dateAxis.set("start", 0);
                dateAxis.set("end", (end - start) / (1 - start));
            } else if (side == "right") {
                // save dates of last items so that duplicates would not be added
                seriesLast[volumeSeries.uid] = volumeSeries.data.getIndex(volumeSeries.data.length - 1).date;
                seriesLast[sbSeries.uid] = sbSeries.data.getIndex(sbSeries.data.length - 1).date;

                for (var i = 0; i < data.length; i++) {
                    var date = data[i].date;
                    // only add if last items date is smaller then newly added items date
                    if (seriesLast[volumeSeries.uid] < date) {
                        volumeSeries.data.push(data[i]);
                    }
                    if (seriesLast[sbSeries.uid] < date) {
                        sbSeries.data.push(data[i]);
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
    if (dzien == 0) {
        dzien = 7
    }
    while (dzien > 5) {
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
    chart.events.on("panended", function () {
        loadSomeData();
    });


    var wheelTimeout;
    chart.events.on("wheelended", function () {
        // load data with some delay when wheel ends, as this is event is fired a lot
        // if we already set timeout for loading, dispose it
        if (wheelTimeout) {
            wheelTimeout.dispose();
        }

        wheelTimeout = chart.setTimeout(function () {
            loadSomeData();
        }, 50);
    });

    // load some initial data
    loadData(min, max, "none");

    chart.appear(1000, 500);
};
