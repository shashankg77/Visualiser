function print_r(theObj){
  if(theObj.constructor == Array ||
     theObj.constructor == Object){
    document.write("<ul>")
    for(var p in theObj){
      if(theObj[p].constructor == Array||
         theObj[p].constructor == Object){
document.write("<li>["+p+"] => "+typeof(theObj)+"</li>");
        document.write("<ul>")
        print_r(theObj[p]);
        document.write("</ul>")
      } else {
document.write("<li>["+p+"] => "+theObj[p]+"</li>");
      }
    }
    document.write("</ul>")
  }
}

$(document).ready(function() {
	TabbedContent.init();
    ChartCreator.init();
    $(window).resize(function() {
        TabbedContent.updateSize(); 
        ChartCreator.updateSize();
    });

    $(document).keydown(function(e) {
      if (e.keyCode == 38 || e.keyCode == 33)
        TabbedContent.moveUp();
      else if (e.keyCode == 40 || e.keyCode == 34) 
        TabbedContent.moveDown();
      else if (e.keyCode == 32)
        DemoChart.keyDown();
    });
});
