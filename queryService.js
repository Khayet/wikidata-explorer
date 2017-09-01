"use strict"

var queryService = (function () {

let my = {}

let callback = null
let root = ""

// TODO: do something about the naming here
let currentTree = {}
let currentTreeDepth = 0

const queryLimit = 3


my.setCallback = function(newCallback) { callback = newCallback }

my.setRoot = function(newRoot) {
    if (callback === null) {
        console.log("ERROR: No callback function defined.")
    }
    
    // TODO: check if there's a subtree that can be used
    currentTree = {}
    currentTreeDepth = 0

    root = newRoot 
    getWikidata()
}

function getWikidata(entity=root) {
    const query = constructQueryPropsAndObjects(entity, queryLimit) 

    document.getElementById("sampleEntity").textContent = root
    
    const httpRequest = new XMLHttpRequest()
    httpRequest.addEventListener("load", console.log(httpRequest.responseText))
    httpRequest.addEventListener("load", () => { return parseResponse(httpRequest.responseText) })
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

function parseResponse(res) {
    // console.log("Parsing response..")
    const response = JSON.parse(res)
    const results = response.results.bindings 

    const tree = {}

    tree["name"] = results[0].entityLabel.value
    tree["children"] = []
    tree["prop"] = null
    tree["obj"] = null
    
    for (let i = 0; i < results.length; i++) 
    {
        const objUrlParts = results[i].object.value.split("/")

        tree["children"].push( {"name": results[i].objectLabel.value,
                                "children": [],                      
                                "prop": results[i].propLabel.value,
                                "obj": "wd:" + objUrlParts[objUrlParts.length -1],
                                } )
    }

    constructTree(tree)
}

function constructTree(subtree) {
    if (currentTreeDepth === 0)
    {
        currentTree = subtree
        currentTreeDepth++
    }

    for (let i = 0; i < currentTree["children"].length; i++)
    {
        if (currentTree["children"] === []) 
        {
            getWikidata(currentTree["children"][0]["obj"])
        }
        else if (currentTree["children"][i]["name"] === subtree["name"]) 
        {
            currentTree["children"][i]["children"] = Array.prototype.concat(currentTree["children"][i], subtree["children"])
        }
    }

    console.log(currentTree)
    callback(currentTree)
}


return my
}())