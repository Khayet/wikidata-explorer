"use strict"

let selectedEntity = "wd:Q42"
const qs = queryService
qs.setCallback(visualizeTree)
qs.setRoot(selectedEntity)

// TODO: clean this code
function visualize(tree) {
    // See: https://stackoverflow.com/questions/13615381/d3-add-text-to-circle


    const rootLabel = [tree["name"]]

    const labels = [], objects = []
    for (let i = 0; i < tree["children"].length; i++)
    {
        labels.push([tree["children"][i]["prop"], tree["children"][i]["name"]])
        objects.push(tree["children"][i]["obj"])
    }


    const leafColor = "rgba(50, 200, 100, 0.7)"
    const radius = 480
    
    const svg = d3.select("svg")

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
        .attr("dy", ".25em")
        .text((d) => { return d[1] })

    leafSelection.selectAll("g>circle")
        .on("click", function(d, i) { 
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
        .attr("class", "leafCircle")
        .on("mouseover", function() { d3.select(this).style("fill", "blue") })
        .on("mouseleave", function() { d3.select(this).style("fill", leafColor) })
        .on("click", function(d, i) { return qs.setRoot(objects[i]) } )
    
    leafSelection.append("text")
        .attr("class", "leafText")
        .attr("dy", ".25em")
        .text((d) => { return d[1] })


    const links = leafSelection.append("g")
    
    function linePosition(i) {
        const leafPos = arrangeInCircle(i, tree["children"].length, radius, centerX, centerY)
        return [-leafPos[0] + centerX, -leafPos[1] + centerY]
    }

    links.append("line")
        .attr("class", "link")
        .attr("x1", (d, i) => { return linePosition(i)[0] } )
        .attr("y1", (d, i) => { return linePosition(i)[1] } )
        .attr("x2", 0)
        .attr("y2", 0)

    links.append("text")
        .attr("class", "linkText")
        .attr("x", (d, i) => linePosition(i)[0] / 2)
        .attr("y", (d, i) => linePosition(i)[1] / 2)
        .text((d) => { return d[0] } )
        
    const rootSelection = svg.selectAll("g#root")
        .data(rootLabel)

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

    rootNodeText = rootNode.append("text")
        .attr("dy", ".25em")
        .text((d) => { return d })

}

function visualizeTree(treeData) {
    // inspired by the tree diagram example from: https://leanpub.com/d3-t-and-t-v4/read

    console.log(treeData)

    const radii = [200, 480]
    const svg = d3.selectAll("svg")
    const center = [svg.attr("width") / 2, svg.attr("height") / 2]
    const leafColor = "rgba(50, 200, 100, 0.7)"
    
    const group = svg.append("g")
        .attr("transform", "translate(" + center[0] + "," + center[1] + ")")

    let rootName = treeData["name"]

    let treemap = d3.tree(rootName)
        .size([svg.attr("width"), svg.attr("height")])
    
    let nodes = d3.hierarchy(treeData, function(d) {
        return d.children
    })

    nodes = treemap(nodes)

    let node = group.selectAll("g")
            .data(nodes.descendants())
        .enter().append("g")
            .attr("transform", function(d, i) { 
                return i === 0 ? 
                    "translate(" + 0 + "," + 0 + ")" :
                    "translate(" + arrangeInCircle(d.x, d.y)[0] + "," + arrangeInCircle(d.x, d.y)[1] + ")" 
            })

    let link = group.selectAll(".link")
            .data(nodes.descendants().slice(1))
        .enter().append("path")
            .attr("class", "link")
            .attr("d", function(d, i) {

                let myX = arrangeInCircle(d.x, d.y)[0]
                let myY = arrangeInCircle(d.x, d.y)[1]

                let pX = arrangeInCircle(d.parent.x, d.parent.y)[0]
                let pY = arrangeInCircle(d.parent.x, d.parent.y)[1]

                // return "M" + myX + "," + myY
                // + "L" + pX + "," + pY;

                return "M" + myX + "," + myY
                + "C" + myX + "," + myY
                + " " + pX + "," +  myY
                + " " + pX + "," + pY;
            })

    node.append("circle")
        .attr("class", (d, i) => { return i === 0  ? "rootCircle" : "leafCircle" })
        .on("mouseover", function() { d3.select(this).style("fill", "blue") })
        .on("mouseleave", function() { d3.select(this).style("fill", leafColor) })
        .on("click", function(d, i) { return qs.setRoot(d.data.obj) } )
    
    node.append("text")
        .attr("class", (d, i) => { return i === 0  ? "rootText" : "leafText" })
        .text(function(d) { return d.data.name; });
}

// function arrangeInCircle(index, num, radius, cx=0.0, cy=0.0) {
//     let x = 0.0, y = 0.0

//     x = radius * Math.cos(index * (2*Math.PI / num)) + cx
//     y = radius * Math.sin(index * (2*Math.PI / num)) + cy

//     return [x, y]
// }

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