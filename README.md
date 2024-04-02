# List `_entities` requests from operations

This script generates a list of `_entities` requests that are part of the query plan for a given operation, along with their required input variables.

## Using without installing (via NPX)

```bash
APOLLO_KEY=xxx APOLLO_GRAPH_REF=MyGraph@variant npx github:@apollosolutions/entity-requests-from-queryplan \                                            
  --operations path/to/operations/
```

The output of this script will be a json file in the current directory in the following format:

```bash
entity-ops-${now}.json
```

## Setup

- Download this repository
- Install dependencies
- Set environment variables

### Install dependencies

`npm install`

### Set environment variables

Copy the `.env-example` file

```bash
cp .env-example .env
```

Set the following environment variables:

- `APOLLO_KEY` (required)
- `APOLLO_GRAPH_REF` (used if not overridden)

Export environment variables so the script can use them:

```bash
source .env
```

## Usage

### Required Arguments

- `--operations` The path to a local directory that contains the operations to process.
- `--supergraph` (path to a local [supergraph schema](https://www.apollographql.com/docs/federation/federated-types/overview/#supergraph-schema) file) **OR** `--graphref` ([Graph Reference](https://www.apollographql.com/docs/resources/glossary/#graph-ref) of published schemas to GraphOS.)

### Example using a local supergraph file

```bash
./bin/index.js \
  --operations examples \
  --supergraph examples/supergraph.graphql
```

### Example using a graphref

```bash
APOLLO_GRAPH_REF="MyGraphId@variant" ./bin/index.js --operations examples 
# OR
./bin/index.js --operations path/to/ops/ --graphref MyGraphId@variant
```

### Other arguments

- `--out` To override the name of the script output file.

___________
**The code in this repository is experimental and has been provided for reference purposes only. Community feedback is welcome but this project may not be supported in the same way that repositories in the official [Apollo GraphQL GitHub organization](https://github.com/apollographql) are. If you need help you can file an issue on this repository, [contact Apollo](https://www.apollographql.com/contact-sales) to talk to an expert, or create a ticket directly in Apollo Studio.**
___________
