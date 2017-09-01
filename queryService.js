"use strict"

var queryService = (function () {

let callback = null
let root = ""
let my = {}

my.setCallback = function(newCallback) { callback = newCallback }

my.setRoot = function(newRoot) { 
    if (callback === null) {
        console.log("ERROR: No callback function defined.")
    }
    
    root = newRoot 
    getWikidata()
}

function getWikidata() {
    const query = constructQueryPropsAndObjects(20) 

    document.getElementById("sampleEntity").textContent = root
    
    const httpRequest = new XMLHttpRequest()
    httpRequest.addEventListener("load", console.log(httpRequest.responseText))
    httpRequest.addEventListener("load", function() { return parseResponse(httpRequest.responseText) })
    httpRequest.open(
        "GET", 
        "https://query.wikidata.org/sparql?query=" + query + "&format=json", true)
    httpRequest.send()
}

function constructQueryPropsAndObjects(limit = 10) {
    // Queries all properties associated entities of the given entity.
    // See: https://stackoverflow.com/questions/25100224/how-to-get-a-list-of-all-wikidata-properties
    // Also: https://query.wikidata.org/ example: data of douglas adams
    const query =
    "SELECT ?entityLabel ?prop ?propLabel ?object ?objectLabel " +
    "WHERE  { " +
    root + " ?propUrl ?object . " + // get all propertyUrls and objects of entity
    "?prop ?ref ?propUrl . " + // get property referred to by url
    "?prop rdf:type wikibase:Property .  " + // restrict to wikibases properties
    "?object rdfs:label ?objectLabel . " + // get label of objects "
    root + " rdfs:label ?entityLabel .  " + // get label of our entity
    "SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". } " +
    "FILTER (LANG(?objectLabel) = 'en') . " +
    "FILTER (LANG(?entityLabel) = 'en') . " +
    "FILTER (?propUrl != wdt:P1963) . " + // specifically exclude "properties for this type"-property
    "} " +
    "LIMIT " + limit

    console.log(query)
    return query
} 

function parseResponse(res) {
    // console.log("Parsing response..")
    const response = JSON.parse(res)
    const properties = [], objects = []
    const propertyLabels = [], objectLabels = []

    const results = response.results.bindings 

    const tree = {}

    tree["root"] = results[0].entityLabel.value
    tree["children"] = []
    
    for (let i = 0; i < results.length; i++) 
    {
        const objUrlParts = results[i].object.value.split("/")

        tree["children"].push( {"prop": results[i].propLabel.value,
                                "obj": "wd:" + objUrlParts[objUrlParts.length -1],
                                "objLabel": results[i].objectLabel.value,
                                "children": []} )
    }

    callback(tree)
}

return my
}())