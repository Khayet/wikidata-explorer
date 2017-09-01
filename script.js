"use strict"

let selectedEntity = "wd:Q42"
const qs = queryService
qs.setCallback(visualize)
qs.setRoot(selectedEntity)

// TODO: clean this code
function visualize(tree) {
    // See: https://stackoverflow.com/questions/13615381/d3-add-text-to-circle

    const rootLabel = [tree["root"]]

    const labels = [], objects = []
    for (let i = 0; i < tree["children"].length; i++)
    {
        labels.push([tree["children"][i]["prop"], tree["children"][i]["objLabel"]])
        objects.push(tree["children"][i]["obj"])
    }


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


    let leafSelection = svg.selectAll("g:not(#root)").data(labels)

    leafSelection.attr("transform", (d, i) => 
        { 
            return "translate(" + 
                arrangeInCircle(i, tree["children"].length, radius, centerX, centerY)[0] + ", " + 
                arrangeInCircle(i, tree["children"].length, radius, centerX, centerY)[1] + 
                ")" 
        }) 

    leafSelection.selectAll("g>text")
        .text((d) => { return d[1] })

    leafSelection.selectAll("g>circle")
        .on("click", function(d, i) { 
            console.log(objects[i])
            return qs.setRoot(objects[i]) } )
    
    leafSelection = leafSelection.enter()
        .append("g")
            .attr("transform", (d, i) => 
            { 
                return "translate(" + 
                arrangeInCircle(i, tree["children"].length, radius, centerX, centerY)[0] + ", " + 
                arrangeInCircle(i, tree["children"].length, radius, centerX, centerY)[1] + 
                ")" 
            }) 

    leafSelection.append("circle")
        .attr("r", 40)
        .style("fill", leafColor)
        .on("mouseover", function() { d3.select(this).style("fill", "blue") })
        .on("mouseleave", function() { d3.select(this).style("fill", leafColor) })
        .on("click", function(d, i) { 
            console.log(objects[i])
            return qs.setRoot(objects[i]) 
        } )

    
    leafSelection.append("text")
        .text((d) => { return d[1] })
        .attr("font-family", "Verdana, sans-serif")
        .attr("font-size", "150%")        
        .attr("text-anchor", "middle")
        .style("fill", "black")

    const links = leafSelection.append("g")
    
    function linePosition(i) {
        const leafPos = arrangeInCircle(i, tree["children"].length, radius, centerX, centerY)
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
        

    console.log(rootLabel)
    const rootSelection = svg.selectAll("g#root")
            .data(rootLabel)

    console.log(rootSelection)

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

function arrangeInCircle(index, num, radius, cx=0.0, cy=0.0) {
    let x = 0.0, y = 0.0

    x = radius * Math.cos(index * (2*Math.PI / num)) + cx
    y = radius * Math.sin(index * (2*Math.PI / num)) + cy

    return [x, y]
}