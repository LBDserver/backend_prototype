defaultBody = (context, baseURI, data) => {
    return {
        name: context,
        status: "NONE",
        message: "",
        context,
        replaceGraphs: [],
        baseURI,
        forceSerial: false,
        type: "text",
        format: "text/turtle",
        data: data,
        timestamp: Date.now(),
        parserSettings: {
            "preserveBNodeIds": false,
            "failOnUnknownDataTypes": false,
            "verifyDataTypeValues": false,
            "normalizeDataTypeValues": false,
            "failOnUnknownLanguageTags": false,
            "verifyLanguageTags": true,
            "normalizeLanguageTags": false,
            "stopOnError": true
        },
        xRequestIdHeaders: null
    }
}

module.exports = defaultBody