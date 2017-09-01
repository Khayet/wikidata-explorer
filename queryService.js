"use strict"

var queryService = (function () {

let callback = undefined
let root = ""
let my = {}

my.setCallback = function(newCallback) { callback = newCallback }

my.setRoot = function(newRoot) { 
    if (callback === undefined) {
        console.log("ERROR: No callback function defined.")
    }
    
    root = newRoot 
    getWikidata(root)
}

function getWikidata(entity) {
    console.log("Entity: " + entity)
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
    // console.log("Parsing response..")
    const response = JSON.parse(res)
    const properties = [], objects = []
    const propertyLabels = [], objectLabels = []

    const results = response.results.bindings 

    // entityLabel should be the same for all results
    const entityLabel = []
    entityLabel.push(results[0].entityLabel.value)

    for (let i = 0; i < results.length; i++) 
    {
        const objUrlParts = results[i].object.value.split("/")
        const obj = objUrlParts[objUrlParts.length -1]

        properties.push(results[i].prop.value)
        objects.push("wd:" + obj)
        propertyLabels.push(results[i].propLabel.value)
        objectLabels.push(results[i].objectLabel.value)
    }

    // visualizeResults(entityLabel, properties, objects, propertyLabels, objectLabels)
    // TODO: pass a tree object instead
    callback(entityLabel, properties, objects, propertyLabels, objectLabels)
}

return my
}())