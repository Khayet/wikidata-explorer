"use strict"

var queryService = (function () {

let my = {}

let callback = null
let root = ""

let currentTree = {}
let currentTreeDepth = 0
let functionQueue = []

const queryLimit = 5
let numQueries = 0

my.setCallback = function(newCallback) { callback = newCallback }

my.setRoot = function(newRoot) {
    if (callback === null) {
        console.log("ERROR: No callback function defined.")
    }

    root = newRoot
    
    if (currentTreeDepth > 0) {
        let node = findNodeByObject(newRoot)
        if (node !== undefined && node.children.length > 0) {
            currentTree = node
            currentTreeDepth = getDepth(currentTree) - 1
            functionQueue.push([completeTree, undefined])
            executeQueue()
            return
        }
    }

    functionQueue.push([constructTree, undefined])
    currentTree = {}
    currentTreeDepth = 0
    executeQueue()
}

function findNodeByObject(obj) {
    // breadth first search in currentTree for node with passed object

    let queue = currentTree.children
    let max = queue.length, i = 0

    while (i < max)
    {
        var node = queue[i]
        if (node.obj === obj) { return node }

        queue = queue.concat(node.children)
        max += node.children.length
        i++
    }
}

function getDepth(obj) {
    let depth = 0, tmp = 0
    if (obj.children) {
        obj.children.forEach((d) => {
            tmp = getDepth(d)
            if (tmp > depth) { depth = tmp }
        })
    }
    return 1+ depth
}

function constructTree() {
    if (currentTreeDepth === 0)
    {
        functionQueue.push([getWikidata, undefined])
        functionQueue.push([completeTree, undefined])
    }
    executeQueue()
}

function getWikidata(entity=root) {
    const query = constructQueryPropsAndObjects(entity, queryLimit) 

    // document.getElementById("sampleEntity").textContent = root
    $('#sampleEntity').textContent = root
    
    const httpRequest = new XMLHttpRequest()
    httpRequest.addEventListener("load", () => { parseResponse(httpRequest.responseText) })
    httpRequest.open(
        "GET", 
        "https://query.wikidata.org/sparql?query=" + query + "&format=json", true)
    httpRequest.send()

    numQueries++
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

    // const query = 
    // "PREFIX entity: <http://www.wikidata.org/entity/> " +
    // "SELECT ?propUrl ?propLabel ?valUrl ?valLabel ?picture " +
    // "WHERE { " +
    // "hint:Query hint:optimizer 'None' . " +
    // "{BIND(entity:Q42 AS ?valUrl) . " +
    // "BIND(\"N/A\" AS ?propUrl ) . " +
    // "BIND(\"identity\"@en AS ?propLabel ) . " +
    // "} " +
    // "UNION " +
    // "{entity:Q42 ?propUrl ?valUrl . " +
    // "?property ?ref ?propUrl . " +
    // "?property rdf:type wikibase:Property . " +
    // "?property rdfs:label ?propLabel} " +
    // "?valUrl rdfs:label ?valLabel " +
    // "FILTER (LANG(?valLabel) = 'en') . " +
    // "OPTIONAL{ ?valUrl wdt:P18 ?picture .} " +
    // "FILTER (lang(?propLabel) = 'en' )} " +
    // "ORDER BY ?propUrl ?valUrl " +
    // "LIMIT 50"
 
    // console.log(query)
    return query
} 

function parseResponse(res) {
    // console.log("Parsing response..")
    const response = JSON.parse(res)
    const results = response.results.bindings 

    const tree = {}

    tree.name = results[0].entityLabel.value
    tree.children = []

    // if the property is already a child, push object to its children
    // if the property is not a child yet, push it to the tree's children

    let propNames = new Set()

    for (let i = 0; i < results.length; i++) 
    {
        const objUrlParts = results[i].object.value.split("/")
        const propLabel = results[i].propLabel.value

        if (propNames.has(propLabel))
        {
            let cont = false
            for (let j = 0; j < tree.children.length; j++)
            {
                if (tree.children[j].name === propLabel) 
                { 
                    tree.children[j].children.push( { "name": results[i].objectLabel.value,
                                             "children": [],                      
                                             "prop": propLabel,
                                             "obj": "wd:" + objUrlParts[objUrlParts.length -1], 
                                            } )
                    break
                }
            }
        }
        else
        {
            tree.children.push( { "name": propLabel,
                                  "children": [ { "name": results[i].objectLabel.value,
                                                  "children": [],                      
                                                  "prop": propLabel,
                                                  "obj": "wd:" + objUrlParts[objUrlParts.length -1],
                                                } ],
                                  "prop": null,
                                  "obj": null
                                } )
            propNames.add(propLabel)
        }
    }

    addSubtree(tree)
    executeQueue()
}

function addSubtree(subtree) {
    if (currentTreeDepth === 0) {
        currentTree = subtree
        currentTreeDepth++
    }
    else {
        // find leave by name
        let node = findEmptyNodeWithName(currentTree, subtree.name)
        node.children = node.children.concat(subtree.children)
    }
}

function findEmptyNodeWithName(tree, name) {
    // breadth first search for node without children and passed name

    let queue = tree.children
    let max = queue.length, i = 0

    while (i < max)
    {
        var node = queue[i]
        if (node.children.length === 0 && node.name === name) { return node }

        queue = queue.concat(node.children)
        max += node.children.length
        i++
    }
}

function completeTree() {
    let queue = currentTree.children
    let max = queue.length, i = 0

    // find remaining empty nodes
    while (i < max)
    {
        var node = queue[i]
        if (node.children.length === 0) { functionQueue.push([getWikidata, node.obj]) }

        queue = queue.concat(node.children)
        max += node.children.length
        i++
    }
    executeQueue()
}

function executeQueue() {
    if (functionQueue.length > 0)
    {
        var tuple = functionQueue.shift();
        (tuple[0])(tuple[1])
    }
    else
    {
        console.log("queryService is done!")
        console.log(currentTree)
        console.log("number of queries: " + numQueries)
        numQueries = 0
        callback(currentTree)
    }
}

return my
}())