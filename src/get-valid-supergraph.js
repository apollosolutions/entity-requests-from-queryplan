import { GraphQLClient } from "graphql-request";
import { fetch } from "undici";
import { LATEST_SUPERGRAPH_SCHEMA } from "./LatestSupergraphSchema.js";
import { Supergraph } from "@apollo/federation-internals";
import { readFileSync } from "fs";

const getClient = () => {
  const apolloKey = process.env.APOLLO_KEY ?? "";
  const apolloSudo = process.env.APOLLO_SUDO ?? false;

  if (!apolloKey) {
    throw new Error("APOLLO_KEY environment variable not set");
  }

  return new GraphQLClient(
    "https://graphql.api.apollographql.com/api/graphql",
    {
      fetch,
      headers: {
        "x-api-key": apolloKey, 
        ...(apolloSudo ? { "apollo-sudo": "true " } : {}),
        "apollo-client-name": "subgraph-requests-from-op",
        "apollo-client-version": "1.0.0",
      },
    }
  );
}

const validateGraphrefPattern = (graphref) => {
  const regex = /^\s*([^@\s]+)@([^@\s]+)\s*$/;
  const match = graphref.match(regex);

  if (!match) {
    throw new Error("Invalid graphref pattern");
  }

  return
};

export const getValidSupergraph = async (supergraphInput, graphref) => {
  let supergraph;

  if (supergraphInput) {
    try {
      const supergraphSdl = readFileSync(supergraphInput, "utf-8");
      supergraph = Supergraph.build(supergraphSdl);
    } catch (err) {
      throw new Error(`Error reading supergraph file: ${err.message}`);
    }
  } else {
    console.log("Graphref: ", graphref);
    validateGraphrefPattern(graphref);
    const supergraphResp = await getClient().request(LATEST_SUPERGRAPH_SCHEMA, {
      ref: graphref,
    });

    const supergraphSdl =
      supergraphResp.variant?.__typename === "GraphVariant" &&
        supergraphResp.variant.latestApprovedLaunch?.build?.result
          ?.__typename === "BuildSuccess"
        ? supergraphResp.variant.latestApprovedLaunch.build.result.coreSchema
          .coreDocument
        : "";

    if (!supergraphSdl) {
      throw new Error("No supergraph SDL found");
    };

    supergraph = Supergraph.build(supergraphSdl);
  }

  if (!supergraph) {
    throw new Error("Unable to build or fetch supergraph");
  }
  return supergraph;
}
