"use strict"

var queryService = (function () {

let my = {}

let callback = null
let root = ""
let oldRoots = []
let rootDetails = []

let currentTree = {}
let currentTreeDepth = 0
let functionQueue = []

const queryLimit = 10
let numQueries = 0

my.setCallback = function(newCallback) { callback = newCallback }

my.setRoot = function(newRoot) {
    if (typeof newRoot === 'undefined')
        return

    if (callback === null) {
        console.log("ERROR: No callback function defined.")
    }

    $("html,body,button").css("cursor", "progress");

    if (root != "")
    {
        oldRoots.push(root)
    }
    
    root = newRoot
    rootDetails = []

    functionQueue.push([getRootDetails, undefined])
    executeQueue()

    functionQueue.push([constructTree, undefined])
    currentTree = {}
    currentTreeDepth = 0
    executeQueue()
}

my.back = function ()
{
    if (oldRoots.length != 0)
    {
        root = ""
        my.setRoot(oldRoots.pop())
    }
}

function constructTree() {
    if (currentTreeDepth === 0)
    {
        functionQueue.push([getWikidata, undefined])
        functionQueue.push([completeTree, undefined])
    }
    executeQueue()
}

function getWikipediaExtract(entity)
{
    $.getJSON("https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=sitelinks&sitefilter=enwiki&ids=" + entity.split(":")[1] + "&callback=?", function(data){
        let title = data.entities[entity.split(":")[1]].sitelinks.enwiki.title
        $.getJSON("https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=" + title + "&callback=?", function(data){
            let pages = data.query.pages
            rootDetails["extract"] = pages[Object.keys(pages)[0]].extract
        })

    })
}

function getWikidata(entity=root) {
    const query = constructQueryPropsAndObjects(entity, queryLimit) 

    // document.getElementById("sampleEntity").textContent = root
    $('#sampleEntity').textContent = root
    
    let httpRequest = new XMLHttpRequest()
    httpRequest.addEventListener("load", () => { parseResponse(httpRequest.responseText) })
    httpRequest.open(
        "GET", 
        "https://query.wikidata.org/sparql?query=" + query + "&format=json", true)
    httpRequest.send()

    numQueries++
}

function getRootDetails(entity=root)
{
    const queryRootDetails = constructQueryRootDetails(entity) 

    let httpRequest = new XMLHttpRequest()
    httpRequest.addEventListener("load", () => {
        let res = JSON.parse(httpRequest.responseText)
        let contextNode = d3.select("#context").node()
        rootDetails["label"] = res.results.bindings[0].entityLabel.value
        if (typeof res.results.bindings[0]["desc"] !== 'undefined')
        {
            rootDetails["desc"] = res.results.bindings[0].desc.value
        }
        if (typeof res.results.bindings[0]["pic"] !== 'undefined')
        {
            let filename = res.results.bindings[0].pic.value.split("/")
            // rootDetails["imageFilename"] = filename[filename.length - 1]
            getPicture(filename[filename.length - 1])
            getWikipediaExtract(entity)
        }
        // context.html = res.results.bindings[0].entityLabel.value + res.results.bindings[0].pic.value
    })
    httpRequest.open(
        "GET", 
        "https://query.wikidata.org/sparql?query=" + queryRootDetails + "&format=json", true)
    httpRequest.send()
}

function getPicture(filename)
{
    let url = decodeURI(filename)
    let str = url.replace(/ /g, '_')
    let md5 = $.md5(str)
    let imageUrl = "https://upload.wikimedia.org/wikipedia/commons/"+ md5[0] + "/" + md5[0] + md5[1] + "/" + str
    rootDetails["imageUrl"] = imageUrl
}

function constructQueryRootDetails(entity)
{
    const query = 
    "SELECT ?entityLabel ?entityDescription ?pic ?desc " +
    "WHERE  { " +
    entity + " rdfs:label ?entityLabel . " +
    "OPTIONAL { " + entity + " wdt:P18 ?pic. " + " } " +
    "SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". " + entity + " schema:description ?desc . } " +
    "FILTER (LANG(?entityLabel) = 'en') . }" +
    "LIMIT 10 "

    return query
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

    let propNames = new Set()

    for (let i = 0; i < results.length; i++) 
    {
        const objUrlParts = results[i].object.value.split("/")
        const propLabel = results[i].propLabel.value

        if (propNames.has(propLabel))
        { // if the property is already a child, push object to its children
            let cont = false
            for (let j = 0; j < tree.children.length; j++)
            {
                if (tree.children[j].name === propLabel) 
                { 
                    tree.children[j].children.push( { "name": results[i].objectLabel.value,
                                             "children": [],
                                             "parent": tree.children[j],              
                                             "prop": propLabel,
                                             "obj": "wd:" + objUrlParts[objUrlParts.length -1], 
                                            } )
                    break
                }
            }
        }
        else
        { // if the property is not a child yet, push it to the tree's children
            let newProp = { "name": propLabel,
                            "children": [],
                            "parent": tree,
                            "prop": null,
                            "obj": null
                          }
            
            newProp.children.push( { "name": results[i].objectLabel.value,
                                     "children": [],
                                     "parent": newProp,                     
                                     "prop": propLabel,
                                     "obj": "wd:" + objUrlParts[objUrlParts.length -1],
                                    })

            tree.children.push( newProp )
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
        callback(currentTree, rootDetails, true)
    }
}

return my
}())