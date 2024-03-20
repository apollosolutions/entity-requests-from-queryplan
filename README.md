# List `_entities` requests from an operation

This script takes a GraphQL operation and either a supergraph schema or an Apollo Graph Reference to generate the list of `_entities` requests that are part of the query plan of the operation, with their required input variables.

## Setup

Download this repository.

### Install dependencies

`npm install`

## Usage

```bash
node src/index.js --operation examples/operation.graphql --supergraph examples/supergraph.graphql
node src/index.js --operation examples/operation.graphql --graphref MyGraphId@variant
node src/index.js --operation examples/operation.graphql --graphref $APOLLO_GRAPH_REF --out my-custom-report
```

### Required Arguments

- `--operation`. Path to a local file that defines the operation to process
- `--supergraph` (path to a local supergraph schema file) or `--graphref` ([Graph Reference](https://www.apollographql.com/docs/resources/glossary/#graph-ref) of published schemas to GraphOS.)


___________
**The code in this repository is experimental and has been provided for reference purposes only. Community feedback is welcome but this project may not be supported in the same way that repositories in the official [Apollo GraphQL GitHub organization](https://github.com/apollographql) are. If you need help you can file an issue on this repository, [contact Apollo](https://www.apollographql.com/contact-sales) to talk to an expert, or create a ticket directly in Apollo Studio.**
___________
