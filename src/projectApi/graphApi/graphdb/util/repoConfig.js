const {v4} = require('uuid')

exports.repoConfig = function(title, id) {
    return `#
    # RDF4J configuration template for a GraphDB Free repository
    #
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
    @prefix rep: <http://www.openrdf.org/config/repository#>.
    @prefix sr: <http://www.openrdf.org/config/repository/sail#>.
    @prefix sail: <http://www.openrdf.org/config/sail#>.
    @prefix owlim: <http://www.ontotext.com/trree/owlim#>.
    @prefix shacl: <http://rdf4j.org/config/sail/shacl#>.
    
    
    [] a rep:Repository ;
        rep:repositoryID "${id}" ;
        rdfs:label "${title}" ;
        rep:repositoryImpl [
            rep:repositoryType "graphdb:FreeSailRepository" ;
            sr:sailImpl [
                sail:sailType "graphdb:FreeSail";
                shacl:validationEnabled "true" ;
                shacl:logValidationPlans "false" ;
                shacl:logValidationViolations "false" ;
                shacl:parallelValidation "true" ;
                shacl:globalLogValidationExecution "false" ;
                shacl:cacheSelectNodes "true" ;
                shacl:undefinedTargetValidatesAllSubjects "false" ;
                shacl:ignoreNoShapesLoadedException "false" ;
                shacl:performanceLogging "false" ;
                shacl:rdfsSubClassReasoning "true" ;
                sail:delegate [
                    sail:sailType "graphdb:FreeSail" ;
    
                    owlim:base-URL "http://example.org/owlim#" ;
                    owlim:defaultNS "" ;
                    owlim:entity-index-size "10000000" ;
                    owlim:entity-id-size  "32" ;
                    owlim:imports "" ;
                    owlim:repository-type "file-repository" ;
                    owlim:ruleset "rdfsplus-optimized" ;
                    owlim:storage-folder "storage" ;
    
                    owlim:enable-context-index "false" ;
    
                    owlim:enablePredicateList "true" ;
    
                    owlim:in-memory-literal-properties "true" ;
                    owlim:enable-literal-index "true" ;
    
                    owlim:check-for-inconsistencies "false" ;
                    owlim:disable-sameAs  "true" ;
                    owlim:query-timeout  "0" ;
                    owlim:query-limit-results  "0" ;
                    owlim:throw-QueryEvaluationException-on-timeout "false" ;
                    owlim:read-only "false" ;
                ]
            ]
        ].
`
}