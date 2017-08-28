// query wikidata:

// This should display a sample Wikidata response. We can request either xml, or json, i think.
query = "SELECT ?item ?itemLabel WHERE { ?item wdt:P31 wd:Q146. SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". } } LIMIT 10"

button = document.getElementById("getWikidata")
button.addEventListener("click", function() { getWikidata(query) })

// See: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
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
    response = JSON.parse(this.responseText)

    let results = ""
    for (let i = 0; i < response.results.bindings.length; i++) {
        results += response.results.bindings[i].itemLabel.value + "\n"
    }

    document.getElementById("displayWikidata")
        .textContent += query + "\n\n" + results
}
    
function getWikidata(query) {
    console.log("Sending Request")
    let httpRequest = new XMLHttpRequest()
    httpRequest.addEventListener("load", logResponse)
    httpRequest.addEventListener("load", parseResponse)
    httpRequest.open(
        "GET", 
        "https://query.wikidata.org/sparql?query=" + query + "&format=json", true)
    httpRequest.send()
}