"use strict"

let selectedEntity = "wd:Q42"
const qs = queryService
qs.setCallback(visualize)
qs.setRoot(selectedEntity)

function visualize(treeData) {
    // inspired by the tree diagram example from: https://leanpub.com/d3-t-and-t-v4/read

    console.log(treeData)

    const radii = [200, 480]
    const svg = d3.selectAll("svg")
    const center = [svg.attr("width") / 2, svg.attr("height") / 2]

    const highlightColor = "black"
    
    svg.selectAll("g")
        .data([])
        .exit().remove()

    const group = svg.append("g")
        .attr("transform", "translate(" + center[0] + "," + center[1] + ")")

    let rootName = treeData["name"]

    let treemap = d3.tree(rootName)
        .size([svg.attr("width"), svg.attr("height")])
    
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

                let myX = arrangeInCircle(d.x, d.y)[0]
                let myY = arrangeInCircle(d.x, d.y)[1]

                let pX = arrangeInCircle(d.parent.x, d.parent.y)[0]
                let pY = arrangeInCircle(d.parent.x, d.parent.y)[1]

                let cP1 = [myX, pY]
                let cP2 = [(myX + pX) / 2.0, (myY + pY) / 2.0]
                // let cP1 = arrangeInCircle(d.x, d.parent.y)
                // let cP2 = arrangeInCircle((d.x + d.parent.x) / 2.0, (d.y + d.parent.y) / 2.0)

                linkPosX.push( (myX + pX) / 2 )
                linkPosY.push( (myY + pY) / 2 )

                // return "M" + myX + "," + myY
                // + "L" + pX + "," + pY;

                return "M" + myX + "," + myY
                + "C" + cP1[0] + "," + cP1[1]
                + " " + cP2[0] + "," + cP2[1]
                + " " + pX + "," + pY;
            })

    let leafNode = group.selectAll("g")
            .data(nodes.descendants())
        .enter().append("g")
            .attr("transform", function(d, i) { 
                if (i === 0) {
                    console.table(d)
                }
                return i === 0 ? 
                    "translate(" + 0 + "," + 0 + ")" :
                    "translate(" + arrangeInCircle(d.x, d.y)[0] + "," + arrangeInCircle(d.x, d.y)[1] + ")" 
            })

    leafNode.append("circle")
        .attr("class", (d, i) => { return i === 0  ? "rootCircle" : "leafCircle" })
        .on("mouseover", function() {  d3.select(this).style("fill", highlightColor)})
        .on("mouseleave", function() { d3.select(this).style("fill", null) })
        .on("click", function(d, i) { return qs.setRoot(d.data.obj) } )
    
    leafNode.append("text")
        .attr("class", (d, i) => { return i === 0  ? "rootText" : "leafText" })
        .text(function(d) { return d.data.name; });

    let linkTextNode = group.selectAll(".linkText")
            .data(nodes.descendants().slice(1))
        .enter().append("text")
            .attr("class", "linkText")
            .attr("x", (d, i) => {return linkPosX[i]} )
            .attr("y", (d, i) => {return linkPosY[i]} )
            .text((d) => { return d.data.prop } )
}

function arrangeInCircle(x, y, domainX=1920, domainY=1080) {
    let xScale = d3.scaleLinear()
        .domain([0, domainX])
        .range([0, 2.0*Math.PI])

    let yScale = d3.scaleLinear()
        .domain([0, domainY])
        .range([0, 480])

    x = xScale(x)
    y = yScale(y)

    let xNew = y * Math.cos(x)
    let yNew = y * Math.sin(x)

    return [xNew, yNew]
}