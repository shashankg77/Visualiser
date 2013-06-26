var SAStatistics = {
    timerInterval: 2000,
    interval: 20,
    heatmap: null,
    height: 0,
    width: 0,

    init: function() { 
        $.get("getVal.php", {heatmap: [""], m: NodeSelect.nodes}, this.create, "json");
        $("#speslider").slider({
            value:20,
            min: 10,
            max: 120,
            step: 10,
            slide: function( event, ui ) {
                SAStatistics.interval = ui.value;
                SAStatistics.poll();
                $("#speslider .ui-slider-handle").html(ui.value + "s");
                //SAStatistics.timerInterval = Math.min(1000, ui.value * 20);
            }
        });
        $("#speslider .ui-slider-handle").html(this.interval + "s");
        $("#speslider .ui-slider-handle").css("width", "auto");
    },

    plot: function(data) {
        max = 0;
        delay = data["estFor"];
        for (x in delay) {
            for (y in delay[x]) {
                if (delay[x][y] < 0)
                    continue;
                max = Math.max(max, delay[x][y]);
            }
        }
        max = Math.ceil(max);
        SAStatistics.heatmap.update(delay, 0, max);
        SAStatistics.heatmap.updateKey(0 + " s", max + " s");
        var options = ChartCreator.leftRightOptions(data, true, false, null, ["#FFF", "#FFE"]);
        options.yaxis.position = "left";
        //options.yaxis.max = 23;
        //options.yaxis.ticks.splice(22);
        //// dirty hack to make zoidberg disappear when there is no data for him
        //if (!(3 in data.speCount[0].data)) { // if no data for zoidberg
        //    for (var i = 3; i < options.yaxis.ticks.length; i++)
        //        options.yaxis.ticks[i][0]--;
        //    options.yaxis.ticks[3][1] = "";
        //    for (var i = 0; i < data.speCount[1].data.length; i++)
        //        data.speCount[1].data[i][1]--;
        //    options.yaxis.max = 24;
        //}
        $.plot( $("#specount"), data.speCount , options );
        $.plot( $("#speTimeline"), data.speTimeline, ChartCreator.timelineOptions(10, SAStatistics.interval * 100));
    },

    poll: function() {
        $.get("getVal.php", {heatmap: ["estFor"], stats: ["speCount"], interval: this.interval, timeline: ["speTimeline"], m: NodeSelect.nodes}, this.plot, "json");
    },

    resize: function(height, width) {
        this.height = height;
        this.width = width;
        if (this.heatmap != null)
            this.heatmap.resize(this.height * 0.75 - 120, this.width * 0.65);
        $("#specount").css("height", this.height * 0.75 - 120);
        $("#specount").css("width", this.width * 0.35);
        $("#speTimeline").css("width", this.width - 50);
        $("#speTimeline").css("height", this.height * 0.25 - 40 - $("#slider").height());
    },

    create: function(data) {
        SAStatistics.heatmap = new HeatMap("#lifetimemap", data["heatmaptics"]);
        SAStatistics.poll(); 
        SAStatistics.resize(SAStatistics.height, SAStatistics.width);
        SAStatistics.heatmap.titleFormatter = function(v) {
            return "Besteht seit: " + Math.floor(v) + " s";
        };
        SAStatistics.heatmap.valueToBackgoundColor = function(normalvalue) {
            //return "hsl(240, 36%, " + (100 - Math.floor((1-normalvalue) * 71)) + "%)";
            return "hsl(210, " + Math.floor(36 * (normalvalue)) + "%, " + Math.floor(29 + 31 * (1-normalvalue)) + "%)";// Math.floor((1-normalvalue)
        };

        SAStatistics.heatmap.valueToBorderColor = function(normalvalue) {
            //return "hsl(240, 68%, " + (100 - Math.floor((1-normalvalue) * 38)) + "%)";
            return "hsl(210, " + Math.floor(68 * (normalvalue)) + "%, " + Math.floor(62 + 18 * (1-normalvalue)) + "%)";
        };
    }
};



var TrafficChart = {
    timerInterval: 500,
    interval: 30,
    trafficMax: 10000.0,
    limitviolations: 0,

    init: function() { this.poll(); },

    plot: function(data) {
        max = 0;
        for (c in data.TX) {
            for (d in data.TX[c].data) {
                var i = parseFloat(data.TX[c].data[d][0]);
                if (i > max)
                    max = i;
            }
        }
        for (c in data.RX) {
            for (d in data.RX[c].data) {
                var i = parseFloat(data.RX[c].data[d][0]);
                if (i > max)
                    max = i;
            }
        }

        if (TrafficChart.trafficMax < max * 1.2) {
            if (max >= TrafficChart.trafficMax) {
                TrafficChart.trafficMax *= 1.2;
            } else if (max * 1.05 > TrafficChart.trafficMax) {
                TrafficChart.trafficMax *= 1.05;
            } else if (max * 1.2 > TrafficChart.trafficMax) {
                TrafficChart.trafficMax *= 1.01;
            }
        }

        if (TrafficChart.limitviolations > 4) {
            if (max * 2.5 < TrafficChart.trafficMax) {
                TrafficChart.trafficMax *= 0.8;
            } else if (max * 2 < TrafficChart.trafficMax) {
                TrafficChart.trafficMax *= 0.95;
            } else if (max * 1.8 < TrafficChart.trafficMax) {
                TrafficChart.trafficMax *= 0.99;
            }
        }

        if (TrafficChart.trafficMax > max * 1.8)
            TrafficChart.limitviolations++;
        else
            TrafficChart.limitviolations--;

        TrafficChart.trafficMax = Math.max(TrafficChart.trafficMax, 2.0);
        var txoptions = ChartCreator.leftRightOptions(data, true, false, TrafficChart.trafficMax, ["#FFF", "#EEF"]);
        var rxoptions = ChartCreator.leftRightOptions(data, false, false, TrafficChart.trafficMax, ["#FFF", "#FFE"]);
        txoptions.xaxis.transform = function(v) { return -Math.sqrt(v); };
        txoptions.xaxis.inverseTransform = function(v) { return -v*v; };
        rxoptions.xaxis.transform = function(v) { return Math.sqrt(v); };
        txoptions.xaxis.inverseTransform = function(v) { return v*v; };
        txoptions.xaxis.tickFormatter = function(v) { return v / 1000; };
        rxoptions.xaxis.tickFormatter = function(v) { return v / 1000; };
        $.plot( $("#tx"), data.TX, txoptions );
        for (i in data.RX)
            if (data.RX[i].color == "#5c9ee1")
                data.RX[i].color = "#e1d75c";
        $.plot( $("#rx"), data.RX , rxoptions );
        data.rxTimeline[0].color = "#e1d75c";
        timelineoptions = ChartCreator.timelineOptions(10, TrafficChart.interval * 100)
        timelineoptions.yaxis.tickFormatter = function(v) { return v / 1000; };
        timelineoptions.xaxis.tickFormatter = function(v) { return v / 60; };
        timelineoptions.xaxis.tickSize = TrafficChart.interval * 6;
        timelineoptions.yaxis.transform = function(v) { return Math.sqrt(v); };
        timelineoptions.yaxis.inverseTransform = function(v) { return v*v; };
        $.plot( $("#rxTimeline"), [data.rxTimeline[0], data.txTimeline[0]], timelineoptions);
    },

    resize: function(height, width) {
        $("#rx").css("height", height * 0.7 - 120);
        $("#tx").css("height", height * 0.7 - 120);
        $("#rx").css("width", width / 2 - 60);
        $("#tx").css("width", width / 2 + 10);
        $("#rxTimeline").css("height", height * 0.3);
        $("#rxTimeline").css("width", width - 35 - 25);
    },

    poll: function() {
        $.get("getVal.php", {stats: ["TX", "RX"], interval: this.interval, timeline: ["rxTimeline", "txTimeline"], m: NodeSelect.nodes}, this.plot, "json");
    }
};

var HealthChart = {
    timerInterval: 2000,
    interval: 120,

    init: function() { 
        $("#tempslider").slider({
            value: HealthChart.interval,
            min: 60,
            max: 300,
            step: 30,
            slide: function( event, ui ) {
                HealthChart.interval = ui.value;
                HealthChart.poll();
                $("#tempTimelineTitle").html(ui.value / 60 * 100 + " min");
            }
        });
        this.poll(); 
    },

    plot: function(data) {
        var options = ChartCreator.leftRightOptions(data, true, false, 100, ["#FFF", "#FFE"]);
        options.yaxis.position = "left";
        $.plot( $("#load"), data.loadAvg, options );
        $.plot( $("#freemem"), data.freemem, ChartCreator.leftRightOptions(data, false, false, 256, ["#FFF", "#FFE"]) );
        $.plot( $("#temp"), data.temp, ChartCreator.leftRightOptions(data, true, false, 70, ["#FFF", "#FFE"]) );
        var options = ChartCreator.timelineOptions(10, HealthChart.interval * 100);
        options.xaxis.tickFormatter = function(v) { return v / 60; };
        options.xaxis.tickSize = HealthChart.interval * 10;
        $.plot( $("#tempTimeline"), data.tempTimeline, options);
    },

    poll: function() {
        $.get("getVal.php", {stats: ["temp", "freemem", "loadAvg"], interval: this.interval, timeline: ["tempTimeline"], m: NodeSelect.nodes}, this.plot, "json");
    },

    resize: function(height, width) {
        var histogramheight = height * 0.7 - 150;
        $("#temp").css("height", histogramheight);
        $("#load").css("height", histogramheight);
        $("#freemem").css("height", histogramheight);
        $("#load").css("width", width / 3 - 20);
        $("#freemem").css("width", width / 3 - 90);
        $("#temp").css("width", width / 3 - 20);
        $("#tempTimeline").css("height", height * 0.3);
        $("#tempTimeline").css("width", width - 35 - 25);
    }
};

var QualityChart = {
    timerInterval: 1000,
    droprateheatmap: null,
    delayheatmap: null,
    height: 0,
    width: 0,

    init: function() { 
        $.get("getVal.php", {heatmap: [""], m: NodeSelect.nodes}, this.create, "json");
    },

    plot: function(data) {
        QualityChart.droprateheatmap.update(data["dropRate"], 0, 0.2);
        min = 999;
        max = 0;
        delay = data["delay"];
        for (x in delay) {
            for (y in delay[x]) {
                if (delay[x][y] < 0)
                    continue;
                max = Math.max(max, delay[x][y]);
                min = Math.min(min, delay[x][y]);
            }
        }
        min = (min * 1000).toFixed(2);
        max = (max * 1000).toFixed(2);
        QualityChart.delayheatmap.update(delay, min / 1000, Math.max(max / 1000, .025));
        QualityChart.delayheatmap.updateKey(min + " ms", Math.max(max, 25) + " ms");
    },

    poll: function() {
        $.get("getVal.php", {heatmap: ["dropRate", "delay"], m: NodeSelect.nodes}, this.plot, "json");
    },

    resize: function(height, width) {
        this.height = height;
        this.width = width;
        if (this.droprateheatmap != null)
            this.droprateheatmap.resize(this.height, this.width / 2);
        if (this.delayheatmap != null)
            this.delayheatmap.resize(this.height, this.width / 2);
    },

    create: function(data) {
        QualityChart.droprateheatmap = new HeatMap("#dropratemap", data["heatmaptics"]);
        QualityChart.delayheatmap = new HeatMap("#delaymap", data["heatmaptics"]);
        QualityChart.poll(); 
        QualityChart.resize(QualityChart.height, QualityChart.width);
        QualityChart.droprateheatmap.titleFormatter = function(v) {
            return "Paketverlust: " + (v * 100).toFixed(2) + "%";
        };
        QualityChart.droprateheatmap.updateKey("0%", "20%");
        QualityChart.delayheatmap.titleFormatter = function(v) {
            return "Latenz: " + (v * 1000).toFixed(2) + " ms";
        };
    }
};

var DemoChart = {
    timerInterval: 500,

    init: function() { 
        this.poll();
    },

    plot: function(data) {
        var options = { 
            yaxis: {
                color: "#ffffff",
                min: 0,
                max: 100,
                tickLength: 0
            },
            xaxis: {
                show: false,
                color: "#ffffff",
                min: -.5,
                max: .5,
                tickLength: 0
            },
            series: {
                bars: {
                    show: true,
                    barWidth: .8,
                    align: "center"
                }
            },
        };

        data.demotest[0][0][0].color = DemoChart.valueToColor(data.demotest[0][0][0].data[0][1] / 100);
        data.demotest[1][0][0].color = DemoChart.valueToColor(data.demotest[1][0][0].data[0][1] / 100);

        if (data.demotest[0][0][0].data[0][1] == 100 && data.demotest[1][0][0].data[0][1] == 100 
                && Math.max(data.demotest[0][1], data.demotest[1][1]) + 60 < data.demotest[0][2]) {
            data.demotest[0][0][0].data = null;
            data.demotest[1][0][0].data = null;
            data.demotest[0][1] = 0;
            data.demotest[1][1] = 0;
        }
        $.plot( $("#nodeconnections"), data.demotest[0][0], options );
        $.plot( $("#clusterconnections"), data.demotest[1][0], options );

        $("#nodetime").html(data.demotest[0][1] + " s");
        $("#clustertime").html(data.demotest[1][1] + " s");

        var options = ChartCreator.leftRightOptions(data, true, false, null, ["#FFF", "#FFE"]);
        options.yaxis.position = "left";
        //options.yaxis.max = 25;
        //options.yaxis.ticks.splice(24);
        //// dirty hack to make zoidberg disappear when there is no data for him
        //if (!(3 in data.speCount[0].data)) { // if no data for zoidberg
        //    for (var i = 3; i < options.yaxis.ticks.length; i++)
        //        options.yaxis.ticks[i][0]--;
        //    options.yaxis.ticks[3][1] = "";
        //    for (var i = 0; i < data.speCount[1].data.length; i++)
        //        data.speCount[1].data[i][1]--;
        //    options.yaxis.max = 24;
        //}
        $.plot( $("#demospecount"), data.speCount , options );
    },

    valueToColor: function(normalvalue) {
        var r = 0;
        var g = 0;
        if (normalvalue < 0.5) {
            r = 225;
            g = Math.floor((225 - 92) * 2 * normalvalue + 92);
        } else {
            r = Math.floor((225 - 92) * (2 - 2 * normalvalue) + 92);
            g = 225;
        }
        return "rgb(" + r + ", " + g + ", 92)";
        //return "hsl(" + Math.floor((1-normalvalue) * 120) + ", 68%, 62%)";
    },

    resize: function(height, width) {
        $("#clusterconnections").css("height", height - 270);
        $("#nodeconnections").css("height", height - 270);
        $("#clusterconnections").css("width", width * 0.25 - 50);
        $("#nodeconnections").css("width", width * 0.25 - 50);
        $("#demospecount").css("height", height - 250);
        $("#demospecount").css("width", width * 0.5 - 80);
    },

    keyDown: function() {
        if (this.startTimer == 0.0) {
            this.startTimer =  (new Date()).getTime();
        } else if (this.clusterTimer == 0.0 && this.nodeTimer == 0.0) {
            this.clusterTimer = (new Date()).getTime();
            this.nodeTimer = this.clusterTimer;
        } else {
            this.startTimer = 0.0;
            this.clusterTimer = 0.0;
            this.nodeTimer = 0.0;
        }
    },

    poll: function() {
        $.get("getVal.php", {demotest: null, stats: ["speCount"], m: NodeSelect.nodes}, this.plot, "json");
    }
};

var LifetimeHistogram = {
    timerInterval: 500,
    hoursToLookAt: 24,
    intervalStep: 200,
    intervalLimit: 0, // should be multiple of intervalStep, 0 = auto
    changesMade: 1,

    init: function() {         
        if (this.intervalLimit == 0) this.intervalLimit = 25 * this.intervalStep;        
        $("#histoslider").slider({
            value: this.intervalStep,
            min: 50,
            max: 1000,
            step: 50,
            slide: function(event, ui) {
                LifetimeHistogram.intervalStep = ui.value;
                LifetimeHistogram.intervalLimit = 25 * ui.value;
                LifetimeHistogram.changesMade = 1;                              
            }
        });
        $("#hourselect").selectbox({	    
	        onChange: function (val, inst) {
		        LifetimeHistogram.hoursToLookAt = val;
                LifetimeHistogram.changesMade = 1;		    
	        },
	        effect: "slide"
        });
        this.poll();        
    },

    plot: function(data) {       
        var options = ChartCreator.leftRightOptions(data, true, false, data.maxval, ["#FFF", "#FFE"]);
        options.xaxis.tickFormatter = function(v) { return v + "%"; };        
        $.plot($("#histogram"), data.histo, options);
    },

    poll: function() { 
        if (this.changesMade == 1)
        {      
            $.get("getVal.php", {histogram: "", step: this.intervalStep, limit: this.intervalLimit, hours: this.hoursToLookAt}, this.plot, "json");
            //this.changesMade = 0; // uncomment this line to send db queries only when parameters have changed (if query takes long)
        }                
    },

    resize: function(height, width) {
        $("#histogram").css("height", height - 100);
        $("#histogram").css("width", width - 60);        
        $("#histoslider").css("width", width - 60);
        $("#histoslider").css("margin-top", 20);
    }
};

var SARateChart = {
    timerInterval: 1000,
    rateheatmap: null,
    height: 0,
    width: 0,

    init: function() { 
        $.get("getVal.php", {heatmap: [""], m: NodeSelect.nodes}, this.create, "json");
    },

    plot: function(data) {
        min = 999;
        max = 0;
        rate = data["establishRate"];
        for (x in rate) {
            for (y in rate[x]) {
                if (rate[x][y] < 0)
                    continue;
                max = Math.max(max, rate[x][y]);
                min = Math.min(min, rate[x][y]);
            }
        }
        min = Math.floor(min);
        max = Math.ceil(max);
        SARateChart.rateheatmap.update(rate, min, max);
        SARateChart.rateheatmap.updateKey(min, max);
    },

    poll: function() {
        $.get("getVal.php", {heatmap: ["establishRate"], m: NodeSelect.nodes}, this.plot, "json");
    },

    resize: function(height, width) {
        this.height = height;
        this.width = width;
        if (this.rateheatmap != null)
            this.rateheatmap.resize(this.height - 100, this.width);
    },

    create: function(data) {
        SARateChart.rateheatmap = new HeatMap("#saratemap", data["heatmaptics"]);
        SARateChart.poll(); 
        SARateChart.resize(SARateChart.height, SARateChart.width);
        SARateChart.rateheatmap.titleFormatter = function(v) {
            return Math.round(v * 100) / 100 + " Neuaushandlungen pro Tag";
        };
    }
};


var SAPercentageBar = {
    init: function() {             
    },

    plot: function(data) {        
        var options = { 
            yaxis: {                
                color: "#ffffff",
                min: 0,
                max: 100,
                //tickLength: 0,
                tickFormatter: function(v) { return v + "%"; }
            },
            xaxis: {
                show: false,
                color: "#ffffff",
                min: -0.5,
                max: 0.5,
                tickLength: 0
            },
            series: {
                bars: {
                    show: true,
                    barWidth: 1,
                    align: "center"
                }
            },
        };  
        
        data.percentage[0].color = DemoChart.valueToColor(data.percentage[0].data[0][1] / 100.0);        
        $.plot($("#sapercentage"), data.percentage, options);
    },

    poll: function() { 
        $.get("getVal.php", {sapercentage: ""}, this.plot, "json");        
    },

    resize: function(height, width) {
        $("#sapercentage").css("height", height - parseInt($("#sapercentage").css("top"), 10) - 45);
    }
};

var NodeSelect = {
    nodes: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125],

    init: function() {
        $("#nodes").selectbox({        
            onChange: function (val, inst) {
                if (val == 0) {
                    NodeSelect.nodes = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125];
                    $("#testbed").attr("src", "img/testBedNet.png");
                } else if (val == 1) {
                    NodeSelect.nodes = [    15, 20, 25, 30, 35, 40,     50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125     ];
                    $("#testbed").attr("src", "img/testBedNet_1.png");
                } else if (val == 2) {
                    NodeSelect.nodes = [                30, 35,             55,     65,     75,     85, 90, 95,           110, 115               ];
                    $("#testbed").attr("src", "img/testBedNet_2.png");
                } else if (val == 3) {
                    NodeSelect.nodes = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115,           ];
                    $("#testbed").attr("src", "img/testBedNet_3.png");
                } else if (val == 4) {
                    NodeSelect.nodes = [1140, 1141, 1142, 1143, 1144, 1145, 1146, 1147, 1148, 1149, 1150, 1151, 1152, 1153, 1154, 1155, 1156, 1157, 1158, 1159, 1160, 1161, 1162, 1163, 1164, 1165, 1166, 1167, 1168, 1169];

                    //NodeSelect.nodes = [ 1200, 1201, 1202, 1203, 1204];
                    $("#testbed").attr("src", "img/testBedNet.png");
                }
                ChartCreator.init();
            },
            effect: "slide"
        });
    },

    resize: function(height, width) {
    }
};

var CertList = {
    plotted: null,

    init: function() {
        // get parsed information from phpscript and plot them
        $.get("manageCerts.php", {getcert: ""}, CertList.plot, "json");           
        },

    plot: function(data) {      
        plotted = data["cert"];

        // clear already existing table
        $("#certtable tbody").html("");

        table = "";       
        
        // append each entry to certtable
        for(x in plotted) {

            table += '<tr>';

            /*table += '<td width="30%">' + plotted[x][1]  + '</td>';
            table += '<td width="50%">' + plotted[x][2]  + '</td>';
            table += '<td width="5%">' + plotted[x][4]  + '</td>';                       
        
            table += '<td width="15%">' + '<div class="bounds">' + '<label><input type="radio" name="' + x + '" value="on"><span>On</span></label>';
            table += '<label><input type="radio" name="' + x + '" value="off"><span>Off</span></label></div>' + '</td>';                   
            table += '</tr>';*/

            table += '<td class="name">' + plotted[x]['identity']  + '</td>';
            table += '<td class="source">' + plotted[x]['source'] + '</td>';
            table += '<td class="expires">' + plotted[x]['expires']  + '</td>';
            table += '<td class="hash">' + plotted[x]['hash']  + '</td>';                       
        
            table += '<td class="status">'; 
            table += '<div class="bounds">';
            table += '<label><input type="radio" name="' + x + '" value="on"><span>On</span></label>';
            table += '<label><input type="radio" name="' + x + '" value="off"><span>Off</span></label>';
            table += '</div>';
            table += '</td>';                   
            table += '</tr>';
        }        
        $("#certtable tbody").append(table);       
       
       // check status of each certificate and set on/off button to the current state
       for(x in plotted){
            // certificate is revoked?
            if(plotted[x]['revoked'] == "true"){                
                $("input[name=\"" + x + "\"][value=\"off\"]").attr("checked", "checked");              
            }
            else {
                $("input[name=\"" + x + "\"][value=\"on\"]").attr("checked", "checked");                                
            }                          
       }
              
        $('button[name="submit"]').click(function() { CertList.submit(); });
        CertList.resize($(".slide_content").height(), $(".slide_content").width());
    },

    submit: function() {
        revoke = new Array();
        unrevoke = new Array();
        
        // estimate certificates to revoke und certificates to unrevoke
        for(x in plotted) {
            // check current state of on/off button 
            if($('input[name="' + x + '"]').filter('[value="on"]').attr('checked') == true) {
                // no revokation
                isCurrentlyRevoked = "false";
            }
            else {
                isCurrentlyRevoked = "true";
            }            
                    
            // compare current state with initial (stored) state; 
            // fill arrays (unrevoke with serial number, revoke with path of the certificate) 
            
            if(plotted[x]['revoked'] != isCurrentlyRevoked) {
                if(isCurrentlyRevoked == "false") {
                    unrevoke.push(plotted[x]['serial']);
                } else {
                    revoke.push(plotted[x]['file']); 
                }
                // set stored state to the current state
                plotted[x]['revoked'] = isCurrentlyRevoked;
            }   
            
	                                
        }

        success = true;
        // revoke certificates using synchronous call
        jQuery.ajax({
            url: 'manageCerts.php?revoke=' + JSON.stringify(revoke),
            success: function(data) {CertList.handleError(data);},
            async: false,
            dataType: "json"
        });

        // unrevoke certificates using synchronous call
        jQuery.ajax({
            url: 'manageCerts.php?unrevoke=' + JSON.stringify(unrevoke),
            success: function(data) {CertList.handleError(data);},
            async: false,
            dataType: "json"
        });

        // on success distribute certificate list  
        if(success == true){          
            $.get("manageCerts.php", {submit: ""});
            alert("(Un)revocation was successful!");
        }

    },

    handleError: function(data) {
        // operation failed
        if(data["error"].length > 0) {
            success = false;
             
            // reset values in plotted
            /*for(x in plotted) {
                if($.inArray(plotted[x]['file'], revoke) > -1){
                    if(plotted[x]['revoked'] == "true") {
                        plotted[x]['revoked'] = "false";
                    } else {
                        plotted[x]['revoked'] = "true";
                    }
                }
            }*/

            // alert error
            message = "";
            for(entry in data["error"]) {
                message += data["error"][entry]["message"] + " input: " + data["error"][entry]["input"] + "\n";
            }
            alert(message);

            this.init();
        }
    },
    
    resize: function(height, width) {
        this.height = height;
        this.width = width;
        $(".scrollContent").css("height", this.height - 250);
        $("#certtable").css("width", Math.min(700, this.width - 100));
    },
} 

var ChartCreator = {

	currentChart: null,

    timeoutID: 0,

    chartTable: {
        tab_traffic: TrafficChart,
        tab_spestats: SAStatistics,
        tab_health: HealthChart,
        tab_quality: QualityChart,
        tab_demo: DemoChart,
        tab_histogram: LifetimeHistogram,
        tab_sarate: SARateChart,
        tab_certList: CertList,

        //sapercentage: SAPercentageBar,
        nodeselector: NodeSelect
    },

    init: function() {
        for (tab in this.chartTable) {
            this.chartTable[tab].init();
        }
        this.timer();
        this.updateSize();
    },

    leftRightOptions: function(rawdata, showyaxis, inverted, xmax, bgcolors) {
        yticks = rawdata.statstics;

        // set options
        var options = { 
            yaxis: {
                show: showyaxis,
                ticks: yticks,
                max: yticks.length + 1,
                position: "right",
                transform: function (v) { return -v; },
                inverseTransform: function (v) { return -v; },
                color: "#ffffff",
                tickLength: 0,
            },
            xaxis: {
                min: 0,
                max: xmax,
                color: "#ffffff",
            },
            series: {
                bars: {
                    show: true,
                    barWidth: .8,
                    align: "center",
                    horizontal: true,
                }
            },
        };

        if (inverted) {
            options.xaxis.transform = function (v) { return -v; };
            options.xaxis.inverseTransform = function (v) { return -v; };
        }

        return options;
    },

    timelineOptions: function(min, max) {
        return {
            xaxis: {
                transform: function (v) { return -v; },
                inverseTransform: function (v) { return -v; },
                min: min,
                max: max,
                color: "#ffffff",
            },
            yaxis: {
                min: 0,
                color: "#ffffff",
            },
            series: {
                lines: { show: true },
                points: { show: true }
            },
        };
    },

    timer: function() {
        clearTimeout(ChartCreator.timeoutID);
        if (ChartCreator.currentChart in ChartCreator.chartTable) {
            ChartCreator.chartTable[ChartCreator.currentChart].poll();
            ChartCreator.timeoutID = setTimeout(ChartCreator.timer, ChartCreator.chartTable[ChartCreator.currentChart].timerInterval);
        } else {
            ChartCreator.timeoutID = setTimeout(ChartCreator.timer, 1000);
        } 
        //SAPercentageBar.poll();       
    },

    updateSize: function() {
        for (tab in ChartCreator.chartTable) {
            ChartCreator.chartTable[tab].resize($(".slide_content").height(), $(".slide_content").width());
        }        
    }    
}; 
