function HeatMap(divid, tics) {
    this.div = divid,
    this.size = 0,
    this.min = 0,
    this.max = 0,

    table = "";
    table += '<table class="heatmap"><tr><td>'
    table += '<table><tr>';
    table += '<td></td>';
    for (j in tics["nodes"]) {
        table += '<td class="xlabel"';
        if (j in tics["color"])
            table += ' style="color: ' + tics["color"][j] + '"';
        table += '><div class="rotate">' + tics["nodes"][j] + '</div></td>';
        this.size++;
    }
    table += '</tr>';
    for (i in tics["nodes"]) {
        table += '<tr>';
        table += '<td class="ylabel"';
        if (i in tics["color"])
            table += ' style="color: ' + tics["color"][i] + '"';
        table += '>' + tics["nodes"][i] + '</td>';
        for (j in tics["nodes"]) {
            table += '<td class="tableCell" x='+j+' y='+i+' value=""></td>';
        }
        table += '</tr>';
    }
    table += '</table>';
    table += '</td><td class="key">';
    table += '<div id="max"></div><div id="colortransition"></div><div id="min"></div>';
    table += '</td></tr></table>';
    $(divid).html(table);
};

HeatMap.prototype.update = function(data, min, max) {
    this.min = min;
    this.max = max;

    hm = this;
    changes = 0;
    $(this.div).find('.tableCell').each(function(){
        if (changes > 10)
            return;
        x = $(this).attr("x");
        y = $(this).attr("y");
        if (y in data && x in data[y]) {
            var rval = Math.max( Math.min((data[y][x] - min) / (max - min), 1.0), 0.0 );
            if ($(this).attr("value") == "" || Math.floor($(this).attr("value")*100) != Math.floor(rval*100))
                changes++;
        }
    });

    if (changes > 0) {
        $(this.div).find('.tableCell').each(function(){
            x = $(this).attr("x");
            y = $(this).attr("y");
            if (y in data && x in data[y]) {
                var rval = Math.max( Math.min((data[y][x] - min) / (max - min), 1.0), 0.0 );
                if ($(this).attr("value") != "" && Math.floor($(this).attr("value")*100) == Math.floor(rval*100))
                    return;
                if (changes < 10)
                    hm.updateCellAnimate($(this), data[y][x], rval, $(this).attr("value"));
                else
                    hm.updateCell($(this), data[y][x], rval, $(this).attr("value"));
                $(this).attr("value", rval);
            } else {
                if ($(this).attr("value") == "")
                    return;
                if (changes < 10)
                    hm.updateCellAnimate($(this), null, null, $(this).attr("value"));
                else
                    hm.updateCell($(this), null, null, $(this).attr("value"));
                $(this).attr("value", "");
            }
        });
    }
};

HeatMap.prototype.titleFormatter = function(v) { return v; };

HeatMap.prototype.valueToBackgoundColor = function(normalvalue) {
    return "hsl(" + Math.floor((1-normalvalue) * 120) + ", 36%, 29%)";
};

HeatMap.prototype.valueToBorderColor = function(normalvalue) {
    return "hsl(" + Math.floor((1-normalvalue) * 120) + ", 68%, 62%)";
};

HeatMap.prototype.updateCell = function(cell, value, normalvalue, oldnormvalue) {
    if (value == null || value < 0) {
        cell.css({opacity: 0});
        cell.attr("title", "");
    } else {
        cell.css({
            backgroundColor: this.valueToBackgoundColor(normalvalue),
            borderColor: this.valueToBorderColor(normalvalue),
            opacity: 1
        });
        cell.attr("title", cell.attr("y") + " → " + cell.attr("x") + ": " + this.titleFormatter(value));
    }
};

HeatMap.prototype.updateCellAnimate = function(cell, value, normalvalue, oldnormvalue) {
    if (value == null || value < 0) {
        cell.animate({opacity: 0}, 2000);
        cell.attr("title", "");
    } else {
        if (cell.css("opacity") == 0) {
            cell.css({
                backgroundColor: this.valueToBackgoundColor(normalvalue),
                borderColor: this.valueToBorderColor(normalvalue)
            });
            cell.animate({opacity: 1}, 2000);
        } else {
            cell.animate({backgroundColor: this.valueToBackgoundColor(normalvalue)}, 2000*Math.abs(normalvalue - oldnormvalue));
            cell.css({borderColor: this.valueToBorderColor(normalvalue)});
        }
        cell.attr("title", cell.attr("y") + " → " + cell.attr("x") + ": " + this.titleFormatter(value));
    }
};

HeatMap.prototype.updateKey = function(minvalue, maxvalue) {
    mincolor = this.valueToBorderColor(0);
    maxcolor = this.valueToBorderColor(1);
    $(this.div).find("#colortransition").css("background", "-moz-linear-gradient(top, " + maxcolor + " 0%, " + mincolor + " 100%)");
    $(this.div).find("#colortransition").css("background", "-o-linear-gradient(top, " + maxcolor + " 0%, " + mincolor + " 100%)");
    $(this.div).find("#colortransition").css("background", "-webkit-gradient(linear, left top, left bottom, color-stop(0%," + maxcolor + "), color-stop(100%," + mincolor + "))");
    $(this.div).find("#colortransition").css("filter", "progid:DXImageTransform.Microsoft.gradient( startColorstr='" + maxcolor + "', endColorstr='" + mincolor + "',GradientType=0)");
    $(this.div).find('#min').text(minvalue);
    $(this.div).find('#max').text(maxvalue);
    
};

HeatMap.prototype.resize = function(height, width) {
    size = Math.min(height, width - $(this.div).find(".key").width());
    fontsize = Math.min(Math.floor(size / this.size / 6 + 6), 20);
    $(this.div).find(".ylabel").css({fontSize: fontsize});
    $(this.div).find(".xlabel").css({fontSize: fontsize});
    size -= $(this.div).find(".ylabel").width();
    $(this.div).find("#colortransition").css({height: size - 150});
    size /= this.size;
    size -= 5;
    size = Math.floor(size);
    $(this.div).find(".xlabel").css({width: size, height: $(this.div).find(".ylabel").width() + size / 4});
    $(this.div).find(".ylabel").css({height: size});
};
