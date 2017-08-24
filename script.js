// query wikidata:

button = document.getElementById("getWikidata")
button.addEventListener("click", getWikidata)

// See: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
function logResponse() {
    console.log(this.responseText)
}

 function getWikidata() {
    console.log("Sending Request")
    let httpRequest = new XMLHttpRequest()
    httpRequest.addEventListener("load", logResponse)
    httpRequest.open(
        "GET", 
        "https://query.wikidata.org/sparql?query=SELECT" +
        "?item ?itemLabel WHERE { ?item wdt:P31 wd:Q146. SERVICE wikibase:label" +
        "{ bd:serviceParam wikibase:language \"en\". } }" )
    httpRequest.send()
}