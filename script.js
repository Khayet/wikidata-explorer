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
    // Also: https://query.wikidata.org/ example: data of douglas adams
    const query =
        "SELECT ?entityLabel ?prop ?propLabel ?object ?objectLabel " +
        "WHERE  { " +
        entity + " ?propUrl ?object . " + // get all propertyUrls and objects of entity
        "?prop ?ref ?propUrl . " + // get property referred to by url
        "?prop rdf:type wikibase:Property .  " + // restrict to wikibases properties
        "?object rdfs:label ?objectLabel . " + // get label of objects "
        entity + " rdfs:label ?entityLabel .  " + // get label of our entity
        "SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". } " +
        "FILTER (LANG(?objectLabel) = 'en') . " +
        "FILTER (LANG(?entityLabel) = 'en') . " +
        "FILTER (?propUrl != wdt:P1963) . " + // specifically exclude "properties for this type"-property
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
    console.log(res)
    const response = JSON.parse(res)
    const properties = [], objects = []
    const propertyLabels = [], objectLabels = []

    const results = response.results.bindings 

    // entityLabel should be the same for all results
    const entityLabel = []
    entityLabel.push(results[0].entityLabel.value)

    for (let i = 0; i < results.length; i++) {
        properties.push(results[i].prop.value)
        objects.push(results[i].object.value)
        propertyLabels.push(results[i].propLabel.value)
        objectLabels.push(results[i].objectLabel.value)
    }

    visualizeResults(entityLabel, properties, objects, propertyLabels, objectLabels)
}

function visualizeResults(entityLabel, properties, objects, propertyLabels, objectLabels) {
    // See: https://stackoverflow.com/questions/13615381/d3-add-text-to-circle

    const svg = d3.select("svg")
        .style("background-color", "rgb(200, 200, 255)")


    const rootSelection = svg.selectAll("g")
    .data(entityLabel)
    
    const rootNode = rootSelection.enter()
    .append("g")
    .attr("transform", "translate(" + (svg.attr("width") / 2) + ", " + (svg.attr("height") / 2) + ")")
    .attr("id", "root")
    
    console.log(rootNode.attr("transform"))

    const rootNodeCircle = rootNode.append("circle")
    .attr("r", 30)
    .style("fill", "rgb(255, 30, 30)")
    
    const rootNodeText = rootNode.append("text")
    .text((d) => { return d })
    .attr("text-anchor", "middle")
    .style("fill", "white")
    

    const leaveSelection = svg.selectAll("g:not(#root)")
        .data(objectLabels)

    const leaveNodes = leaveSelection.enter()
        .append("g")
        .attr("transform", (d, i) => { return "translate(" + i*80 + ",100)"} )
        
    const circles = leaveNodes.append("circle")
        .attr("r", 40)
        .style("fill", "black")
        .on("mouseover", function(d) { d3.select(this).style("fill", "blue") })
        .on("mouseleave", function() { d3.select(this).style("fill", "black") })
        .on("click", function(d, i) { return selectEntity(i, objects) } )

    const texts = leaveNodes.append("text")
        .text((d) => { return d })
        .attr("text-anchor", "middle")
        .style("fill", "white")

    // groups.exit().remove()
}

function selectEntity(index, entities) {
    console.log("select entity " + index + " " + entities[index])
}