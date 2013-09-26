var TabbedContent = {
	init: function() {	
		$(".tab_item").click(function() {
			var background = $(this).parent().find(".moving_bg");
			
			$(background).stop().animate({ top: $(this).position()['top'] }, { duration: 300 });
			if (TabbedContent.lastTab != null) {
				TabbedContent.lastTab.stop().animate({ color: jQuery.Color("#5c7084") }, { duration: 300 });
			}
			$(this).stop().animate({ color: jQuery.Color("#color: #2368ae") }, { duration: 300 });
			
			TabbedContent.slideContent($(this));
			TabbedContent.lastTab = $(this);
			ChartCreator.currentChart = $(this).attr("id");
		});
		TabbedContent.lastTab = $("#tab_topology");
        $(window).resize(TabbedContent.updateSize);
        TabbedContent.updateSize();
	},
	
	slideContent: function(obj) {
		var margin = $(obj).parent().parent().find(".slide_content").height();
		margin = margin * ($(obj).prevAll().size() - 1);
		margin = margin * -1;


		$(obj).parent().parent().find(".tabslider").stop().animate({
			marginTop: margin + "px"
		}, {
			duration: 300
		});
	},

	moveUp: function() {
		TabbedContent.lastTab.prev().click();
	},

	moveDown: function() {
		TabbedContent.lastTab.next().click();
	},

    updateSize: function () {
        $(".slide_content").css("height", $(window).height() - 20);
        $(".slide_content").css("width", $(window).width() - 290);
        $(".tabcontent").css("height", $(window).height() - 60);

        $(".fullimage").css("width", $(".slide_content").width() - 50);
        $(".fullimage").css("height", "");
        maxheight = $(".tabcontent").height();
        maxwidth = $(".tabcontent").width();
        $(".fullimage").each(function(index) {
            if ($(this).height() > maxheight) {
                $(this).css("height", maxheight - 50);
                $(this).css("width", "");
            }    
        });
        // if ($(".fullimage").height() > $(".tabcontent").height()) {
        //     $(".fullimage").css("height", $(".slide_content").height() - 50);
        //     $(".fullimage").css("width", "");
        // }

        var margin = $(TabbedContent.lastTab).parent().parent().find(".slide_content").height();
        margin = margin * ($(TabbedContent.lastTab).prevAll().size() - 1);
        margin = margin * -1;
        $(TabbedContent.lastTab).parent().parent().find(".tabslider").css("margin-top", margin);
    }
}