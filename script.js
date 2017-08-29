"use strict"

getWikidata("wd:Q5")

function getWikidata(entity) {
    console.log("Sending Request")
    const query = constructQueryPropsAndObjects(entity, 20) 

    document.getElementById("sampleEntity").textContent = entity
    
    const httpRequest = new XMLHttpRequest()
    httpRequest.addEventListener("load", console.log(httpRequest.responseText))
    httpRequest.addEventListener("load", function() { return parseResponse(httpRequest.responseText) })
    httpRequest.open(
        "GET", 
        "https://query.wikidata.org/sparql?query=" + query + "&format=json", true)
    httpRequest.send()
}

function constructQueryPropsAndObjects(entity, limit = 10) {
    // Queries all properties associated entities of the given entity.
    // See: https://stackoverflow.com/questions/25100224/how-to-get-a-list-of-all-wikidata-properties
    const query =
        "SELECT ?entityLabel ?prop ?propLabel ?object ?objectLabel " +
        "WHERE  { " +
        entity + " ?propUrl ?object . " +
        "?prop ?ref ?propUrl . " +
        "?prop rdf:type wikibase:Property . " +
        "?object rdfs:label ?objectLabel . " +
        entity + " rdfs:label ?entityLabel . " +
        "SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". } " +
        "FILTER (LANG(?objectLabel) = 'en') . " +
        "FILTER (LANG(?entityLabel) = 'en') . " +
        "} " +
        "LIMIT " + limit
    // console.log(query)
    return query
} 


function constructQueryInstancesOf(entity, limit = 10) {
    // constructs a query querying all entities that are instances of the passed entity
    const query =  
        "SELECT ?item ?itemLabel " + 
        "WHERE { " +
        "?item wdt:P31 " + entity + ". " +
        "SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". } " +
        "} " +
        "LIMIT " + limit
    // console.log(query)
    return query
}

function parseResponse(res) {
    console.log("Parsing response..")
    const response = JSON.parse(res)
    const properties = [], objects = []
    const propertyLabels = [], objectLabels = []

    const results = response.results.bindings 

    // entityLabel should be the same for all results
    const entityLabel = []
    entityLabel.push(results[0].entityLabel.value)

    for (let i = 0; i < results.length; i++) {
        properties.push(results[i].prop.value)
        objects.push(results[i].prop.value)
        propertyLabels.push(results[i].propLabel.value)
        objectLabels.push(results[i].objectLabel.value)
    }

    visualizeResults(entityLabel, properties, objects, propertyLabels, objectLabels)
}

function visualizeResults(entityLabel, properties, objects, propertyLabels, objectLabels) {
    // See: https://stackoverflow.com/questions/13615381/d3-add-text-to-circle

    let svg = d3.select("svg")
        .style("background-color", "rgb(200, 200, 255)")


    let groups = svg.selectAll("g") //TODO: find better name
        .data(objectLabels)

    // let rootNode = rootGroup.enter()
    //     .append("g")
    //     .attr("transform", "translate(100, 400)")

    // let rootNodeCircle = rootNode.append("circle")
    //     .attr("r", 30)
    //     .style("fill", "rgb(255, 30, 30)")

    // let rootNodeText = rootNode.append("text")
    //     .text(function (d) { return d })
    //     .attr("text-anchor", "middle")
    //     .style("fill", "white")

    let nodes = groups.enter()
        .append("g")
        .attr("transform", function(d, i) { return "translate(" + i*80 + ",100)"} )
        
        let circles = nodes.append("circle")
        .attr("r", 40)
        .style("fill", "black")

    let texts = nodes.append("text")
        .text(function (d) { return d })
        .attr("text-anchor", "middle")
        .style("fill", "white")

    // groups.exit().remove()


}

