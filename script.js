"use strict"

let selectedEntity = "wd:Q42"
const qs = queryService
qs.setCallback(visualizeResults)
qs.setRoot(selectedEntity)


// TODO: receive a tree object instead and parse that
function visualizeResults(entityLabel, properties, objects, propertyLabels, objectLabels) {
    // See: https://stackoverflow.com/questions/13615381/d3-add-text-to-circle
    const leafColor = "rgba(50, 200, 100, 0.7)"
    const radius = 480
    
    const svg = d3.select("svg")
        .style("background-color", "rgb(200, 200, 255)")

    const centerX = svg.attr("width") / 2
    const centerY = svg.attr("height") / 2

    // update leaves
    svg.selectAll("g:not(#root)")
        .data([])
        .exit().remove()

    const labels = []
    for (let i = 0; i < objectLabels.length; i++)
    {
        labels.push([propertyLabels[i], objectLabels[i]])
    }

    let leafSelection = svg.selectAll("g:not(#root)").data(labels)

    leafSelection.attr("transform", (d, i) => 
        { 
            return "translate(" + 
                arrangeInCircle(i, objectLabels.length, radius, centerX, centerY)[0] + ", " + 
                arrangeInCircle(i, objectLabels.length, radius, centerX, centerY)[1] + 
                ")" 
        }) 

    leafSelection.selectAll("g>text")
        .text((d) => { return d[1] })

    leafSelection.selectAll("g>circle")
        .on("click", function(d, i) { return selectEntity(i, objects) } )
    
    leafSelection = leafSelection.enter()
        .append("g")
            .attr("transform", (d, i) => 
            { 
                return "translate(" + 
                arrangeInCircle(i, objectLabels.length, radius, centerX, centerY)[0] + ", " + 
                arrangeInCircle(i, objectLabels.length, radius, centerX, centerY)[1] + 
                ")" 
            }) 

    leafSelection.append("circle")
        .attr("r", 40)
        .style("fill", leafColor)
        .on("mouseover", function() { d3.select(this).style("fill", "blue") })
        .on("mouseleave", function() { d3.select(this).style("fill", leafColor) })
        .on("click", function(d, i) { return selectEntity(i, objects) } )

    
    leafSelection.append("text")
        .text((d) => { return d[1] })
        .attr("font-family", "Verdana, sans-serif")
        .attr("font-size", "150%")        
        .attr("text-anchor", "middle")
        .style("fill", "black")

    const links = leafSelection.append("g")
    
    function linePosition(i) {
        const leafPos = arrangeInCircle(i, objectLabels.length, radius, centerX, centerY)
        return [-leafPos[0] + centerX, -leafPos[1] + centerY]
    }

    links.append("line")
        .attr("x1", (d, i) => { return linePosition(i)[0] } )
        .attr("y1", (d, i) => { return linePosition(i)[1] } )
        .attr("x2", 0)
        .attr("y2", 0)
        .style("stroke", "black")

    links.append("text")
        .attr("font-family", "Verdana, sans-serif")
        .attr("text-anchor", "middle")
        .style("fill", "black")
        .attr("x", (d, i) => linePosition(i)[0] / 2)
        .attr("y", (d, i) => linePosition(i)[1] / 2)
        .text((d) => { return d[0] } )
        

    const rootSelection = svg.selectAll("g#root")
        .data(entityLabel)

    // update root
    let rootNodeCircle = rootSelection.select("g>circle")
        // . ...update root node circle

    let rootNodeText = rootSelection.select("g>text")
        .text((d) => { return d })

    const rootNode = rootSelection.enter()
        .append("g")
        .attr("transform", "translate(" + centerX + ", " + centerY + ")")
        .attr("id", "root")

    rootNodeCircle = rootNode.append("circle")
        .attr("r", 30)
        .style("fill", "rgb(255, 30, 30)")

    rootNodeText = rootNode.append("text")
        .text((d) => { return d })
        .attr("font-family", "Verdana, sans-serif")
        .attr("font-size", "150%")
        .attr("text-anchor", "middle")
        .style("fill", "white")
}

function selectEntity(index, entities) {
    // send new query
    // console.log("select entity " + index + " " + entities[index])
    getWikidata(entities[index], 20)
}

function arrangeInCircle(index, num, radius, cx=0.0, cy=0.0) {
    let x = 0.0, y = 0.0

    x = radius * Math.cos(index * (2*Math.PI / num)) + cx
    y = radius * Math.sin(index * (2*Math.PI / num)) + cy

    return [x, y]
}