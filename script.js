"use strict"

const button = document.getElementById("getWikidata")
button.addEventListener("click", function() { getWikidata("wd:Q963") }) // wd:Q146 -> cat

//see: https://stackoverflow.com/questions/25100224/how-to-get-a-list-of-all-wikidata-properties
function constructQueryPropsAndObjects(entity, limit = 10) {
    const query =
        "SELECT ?prop ?propLabel ?object ?objectLabel " +
        "WHERE  { " +
        entity + " ?propUrl ?object . " +
        "?prop ?ref ?propUrl . " +
        "?prop rdf:type wikibase:Property . " +
        "?object rdfs:label ?objectLabel . " +
        "SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". } " +
        "FILTER (LANG(?objectLabel) = 'en') . " +
        "} " +
        "LIMIT " + limit
    console.log(query)
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
    console.log(query)
    return query
}

function logResponse() {
    console.log(this.responseText)
}

function displayResponse() {
    console.log("Printing response text..")
    document.getElementById("displayWikidata")
        .textContent = this.responseText
}

function parseResponse(res) {
    console.log("Parsing response..")
    console.log(res)
    const response = JSON.parse(res)
    const properties = []
    const objects = []
    const results = response.results.bindings 
    for (let i = 0; i < results.length; i++) {
        properties.push(results[i].propLabel.value)
        objects.push(results[i].objectLabel.value)
        // results += response.results.bindings[i].propLabel.value + "   " + response.results.bindings[i].objectLabel.value + "\n"
        // results += response.results.bindings[i].item.value + ": " + response.results.bindings[i].itemLabel.value + "\n"
    }

    for (let i = 0; i < results.length; i++) {
        document.getElementById("displayWikidata")
            .textContent += properties[i] + " ... " + objects[i] + "\n"
    }
}
    
function getWikidata(entity) {
    console.log("Sending Request")
    // const query = constructQueryInstancesOf(entity, 20) 
    const query = constructQueryPropsAndObjects(entity, 20) 
    
    const httpRequest = new XMLHttpRequest()
    httpRequest.addEventListener("load", console.log(httpRequest.responseText))
    httpRequest.addEventListener("load", function() { return parseResponse(httpRequest.responseText) })
    httpRequest.open(
        "GET", 
        "https://query.wikidata.org/sparql?query=" + query + "&format=json", true)
    httpRequest.send()
}