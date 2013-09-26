var selectedValue, connection, graph;

function loadGraph(selectVal) {
    selectVal = selectVal || "direct";
    if (connection === undefined && graph === undefined) {
        selectedValue = selectVal;
        loadValues();

    } else if (selectVal != selectedValue) {
        graph.clear();
        selectedValue = selectVal;
        makeGraph();
    }
}

function loadValues() {
    graph = Viva.Graph.graph();
    var colors = [
        "#1f77b4", "#aec7e8",
        "#ff7f0e", "#ffbb78",
        "#2ca02c", "#98df8a",
        "#d62728", "#ff9896",
        "#9467bd", "#c5b0d5",
        "#c49c94", "#dbdb8d",
        "#e377c2", "#f7b6d2",
        "#c7c7c7", "#bcbd22",
        "#17becf", "#9edae5"];
    var cssGraphics = Viva.Graph.View.cssGraphics();

    cssGraphics.node(function (node) {
        var nodeUI = document.createElement('div');
        nodeUI.setAttribute('class', 'node');
        nodeUI.title = JSON.stringify(node.data);
        nodeUI.style.background = colors[Math.floor(Math.random() * 18)];
        return nodeUI;
    });

    var svgGraphics = Viva.Graph.View.svgGraphics();
    var highlightRelatedNodes = function (nodeId, isOn) {
        graph.forEachLinkedNode(nodeId, function (node, link) {
            if (link && link.ui) {
                link.ui.attr('stroke', isOn ? '#E40724' : '#C1B6FA');
            }
        });
    };

    svgGraphics.node(function (node) {

        var appearance = Viva.Graph.svg('g');
        var svgText = Viva.Graph.svg('text')
            .attr('y', '3.0px')
            .attr('x', '0.5px')
            .attr('font-size', '11')
            .attr('text-anchor', 'middle')
            .text(node.id);

        var circle = Viva.Graph.svg('circle')
            .attr('r', 10)
            .attr("fill", colors[Math.floor(Math.random() * 18)]);
        circle.append("title").text(JSON.stringify(node.data));

        var maskingCircle = Viva.Graph.svg('circle')
            .attr('r', 10)
            .attr('fill', 'transparent');
        maskingCircle.append("title").text(JSON.stringify(node.data));

        appearance.append(circle);
        appearance.append(svgText);
        appearance.append(maskingCircle);

        $(appearance).hover(function () { // mouse over
            highlightRelatedNodes(node.id, true);
        }, function () { // mouse out
            highlightRelatedNodes(node.id, false);
        });
        return appearance;

    }).placeNode(function (nodeUI, pos) {
        nodeUI.attr('transform',
            'translate(' + (pos.x) + ',' + (pos.y) +
            ')');
    });

    svgGraphics.link(function (link) {
        var line = Viva.Graph.svg('line')
            .attr('stroke', '#C1B6FA');

        line.append("title").text(JSON.stringify(link.data));

        return line;
    });


    var layout = Viva.Graph.Layout.forceDirected(graph, {
        springLength: 43,
        springCoeff: 0.0008,
        dragCoeff: 0.017,
        gravity: -1.2
    });

    connection = new WebSocket('ws://localhost:8888/feed');
    connection.onopen = function () {
        var renderer = Viva.Graph.View.renderer(graph, {
            container: document.getElementById('graph'),
            graphics: svgGraphics,
            renderLinks: true,
            layout: layout
        });

        renderer.run();
        console.log("Connected!");
    };
    makeGraph();
}

function makeGraph() {
    connection.onmessage = function (receivedData) {
        try {
            var data = JSON.parse(receivedData.data);
            if (data.type == "vertex") {
                if (data.event == "add") {
                    if (graph.getNode(data.id) === undefined) {
                        console.log("Adding Node " + data.id);
                        graph.addNode(data.id, data.details);
                    }

                } else if (data.event == "remove") {
                    if (graph.getNode(data.id) !== undefined) {
                        console.log("Removing Node " + data.id);
                        graph.removeNode(data.id);
                    } else console.log("Node " + data.id + " not present");
                } else if (data.event == "update") {
                    if (graph.getNode(data.id) !== undefined) {
                        var tempNode = graph.getNode(data.id);
                        tempNode.data = data.details;
                        tempNode.ui.childNodes[0].childNodes[0].text(JSON.stringify(data.details));
                        tempNode.ui.childNodes[2].childNodes[0].text(JSON.stringify(data.details));
                        if (tempNode.ui.childNodes[0].attr('fill') === 'undefined') {
                            tempNode.ui.childNodes[0].attr('fill', colors[Math.floor(Math.random() * 19)]);
                        }
                    } else graph.addNode(data.id, data.details);
                }
            } else if (data.type == "edge" && data.SAtype == selectedValue) {
                var checkOldLink = (graph.hasLink(data.from, data.to) || graph.hasLink(data.to, data.from));
                if (data.event == "add") {
                    if (!checkOldLink) {
                        console.log("Adding " + selectedValue + " Link " + data.from + "  " + data.to);
                        graph.addLink(data.from, data.to, data.details);
                    } else {
                        graph.forEachLink(function (link) {
                            if (link == checkOldLink) {
                                link.data = data.details;
                                link.ui.childNodes[0].text(JSON.stringify(data.details));
                            }
                        });
                    }
                } else if (data.event == "update") {
                    if (checkOldLink !== null && checkOldLink !== undefined) {
                        graph.forEachLink(function (link) {
                            if (link == checkOldLink) {
                                link.data = data.details;
                                link.ui.childNodes[0].text(JSON.stringify(data.details));
                            }
                        });
                    } else {
                        console.log("Adding " + selectedValue + " Link " + data.from + "  " + data.to);
                        graph.addLink(data.from, data.to, data.details);
                    }
                } else {
                    if (checkOldLink) {
                        console.log("Removing " + selectedValue + " Link " + data.from + "  " + data.to);
                        graph.removeLink(graph.hasLink(data.from, data.to));
                    }
                }
            } else {}
        } catch (e) {
            console.log(e.message);
            console.log(receivedData);
        }
    };
}
