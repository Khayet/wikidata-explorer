button = document.getElementById("getWikidata")
button.addEventListener("click", function() { getWikidata("wd:Q5") }) // wd:Q146 -> cat

function constructQueryInstancesOf(entity) {
    // constructs a query querying all entities that are instances of the passed entity
    let query =  
        "SELECT ?item ?itemLabel " + 
        "WHERE { " +
        "?item wdt:P31 " + entity + ". " +
        "SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". } " +
        "} " +
        "LIMIT 10 "
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

function parseResponse() {
    console.log("Parsing response..")
    console.log(this.responseText)
    response = JSON.parse(this.responseText)

    let results = ""
    for (let i = 0; i < response.results.bindings.length; i++) {
        results += response.results.bindings[i].item.value + ": " + response.results.bindings[i].itemLabel.value + "\n"
    }

    document.getElementById("displayWikidata")
        .textContent += results
}
    
function getWikidata(entity) {
    console.log("Sending Request")
    let query = constructQueryInstancesOf(entity) 
    let httpRequest = new XMLHttpRequest()
    httpRequest.addEventListener("load", console.log(this.responseText))
    httpRequest.addEventListener("load", parseResponse)
    httpRequest.open(
        "GET", 
        "https://query.wikidata.org/sparql?query=" + query + "&format=json", true)
    httpRequest.send()
}