"use strict"

let selectedEntity = "wd:Q42"
const qs = queryService
qs.setCallback(visualize)
qs.setRoot(selectedEntity)

let collapsedNodes = {}

function visualize(treeData) {
    var margin = { top: 20, right: 20, bottom: 20, left: 20 },
        width =  $('#chart').width() - margin.left - margin.right,
        height =  $(window).height() - margin.top - margin.bottom;

    var svg = d3.select( '#graph' )
                    .attr('preserveAspectRatio', 'xMinYMin meet')
                    .attr('viewBox', '0 0 ' +  ( width ) + ' ' + ( height ) )
                    .attr('width', '100%')
                    .attr('height', height + 'px' )

    let svgWidth = svg.node().getBoundingClientRect().width
    let svgHeight = svg.node().getBoundingClientRect().height
    const center = [svgWidth / 2, svgHeight / 2]

    const highlightColor = "black"
    
    svg.selectAll("g")
        .data([])
        .exit().remove()

    const group = svg.append("g")
        .attr("transform", "translate(" + center[0] + "," + center[1] + ")")

    let rootName = treeData["name"]
    const context = d3.select("#context")
    context.append("text").text(rootName)

    let treemap = d3.tree(rootName)
        .size([svgWidth, height])
    
    let nodes = d3.hierarchy(treeData, function(d) {
        return d.children
    })

    nodes = treemap(nodes)

    let linkPosX = []
    let linkPosY = []

    let link = group.selectAll(".link")
            .data(nodes.descendants().slice(1))
        .enter().append("path")
            .attr("class", "link")
            .attr("d", function(d, i) {

                let myX = arrangeInCircle(d.x, d.y, svgWidth, height)[0]
                let myY = arrangeInCircle(d.x, d.y, svgWidth, height)[1]

                let pX = arrangeInCircle(d.parent.x, d.parent.y, svgWidth, height)[0]
                let pY = arrangeInCircle(d.parent.x, d.parent.y, svgWidth, height)[1]

                let cP1 = [myX, pY]
                let cP2 = [(myX + pX) / 2.0, (myY + pY) / 2.0]

                linkPosX.push( (myX + pX) / 2 )
                linkPosY.push( (myY + pY) / 2 )

                return "M" + myX + "," + myY
                + "L" + pX + "," + pY;

                // return "M" + myX + "," + myY
                // + "C" + cP1[0] + "," + cP1[1]
                // + " " + cP2[0] + "," + cP2[1]
                // + " " + pX + "," + pY;
            })
            .on("click", (d, i) => collapse(d, i) )
            .on("mouseover", (d, i) => highlightPathToRoot(d, i, "green"))
            .on("mouseleave", (d, i) => highlightPathToRoot(d, i, null))

    console.log(link)

    let leafNode = group.selectAll("g")
            .data(nodes.descendants())
        .enter().append("g")
            .attr("transform", function(d, i) { 
                return i === 0 ? 
                    "translate(" + 0 + "," + 0 + ")" :
                    "translate(" + arrangeInCircle(d.x, d.y, svgWidth, height)[0] + "," + arrangeInCircle(d.x, d.y, svgWidth, height)[1] + ")" 
            })

    let circles = leafNode.append("circle")
        .attr("class", (d, i) => {
            if (i === 0) return "rootCircle"
            if (d.data.name === "collapsed") return "collapsedCircle"
            if (d.data.obj === null) return "linkCircle"
            return "leafCircle" 
        })
    
    function collapse(d, i) {
        if (d.data.name === "collapsed") {
            console.log(collapsedNodes)
            reattachNodes(treeData, d.data.parent)
            visualize(treeData)
        } else
        {
            cutNode(treeData, d)
            visualize(treeData)
        }
    }

    function highlightPathToRoot(d, i, color) {
        let element = d
        let path = []                
        while (element) {
            path.push(element)
            element = element.parent
        }

        let circles = leafNode.selectAll("g>circle")
        circles.each(function(datum) {
            for (let j=0; j < path.length; j++) {
                if (datum === path[j]) {d3.select(this).style("fill", color)}
            }
        })

        let links = group.selectAll("path")
        links.each(function(datum) {
            for (let j=0; j < path.length; j++) {
                if (datum === path[j]) {d3.select(this).style("stroke", color)}
            }
        })
    }

    leafNode.selectAll(".leafCircle")
        .on("click", function(d, i) { return qs.setRoot(d.data.obj) } )
        .on("mouseover", (d, i) => highlightPathToRoot(d, i, "green") )
        .on("mouseleave", (d, i) => highlightPathToRoot(d, i, null) )

    leafNode.append("text")
        .attr("class", (d, i) => { 
            if (i === 0) return "rootText"
            if (d.data.obj === null) return "linkText"
            return "leafText" 
         })
        .text(function(d) { return d.data.name; });
}

function cutNode(tree, cutNode) {
    let queue = tree.children
    let max = queue.length, i = 0

    while (i < max)
    {
        var node = queue[i]
        // this is not a guarantee that objects are cut and re-attached at the same position, 
        // but sufficient for our purposes
        if (node.obj === cutNode.data.obj && node.parent === cutNode.data.parent) 
        {
            console.log(node.children)
            collapsedNodes[node.obj] = node.children
            node.children = [ {"name": "collapsed", 
                               "children": [],
                               "parent": node } ] 
            console.log(collapsedNodes)
            return
        }

        queue = queue.concat(node.children)
        max += node.children.length
        i++
    }
}

function reattachNodes(tree, connectingNode) {
    console.log("Reattaching node.. ")
    console.log(connectingNode)
    let queue = tree.children
    let max = queue.length, i = 0

    while (i < max)
    {
        var node = queue[i]
        if (node === connectingNode && node.parent === connectingNode.parent) {
            console.log(collapsedNodes[node.obj])
            node.children = collapsedNodes[node.obj]
            console.log(node)
            collapsedNodes = []
            return
        }

        queue = queue.concat(node.children)
        max += node.children.length
        i++
    }
}

function arrangeInCircle(x, y, domainX, domainY) {
    let xScale = d3.scaleLinear()
        .domain([0, domainX])
        .range([0, 2.0*Math.PI])

    let yScale = d3.scaleLinear()
        .domain([0, domainY])
        .range([0, (domainY / 2.0)-60])

    x = xScale(x)
    y = yScale(y)

    let xNew = y * Math.cos(x)
    let yNew = y * Math.sin(x)

    return [xNew, yNew]
}