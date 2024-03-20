import { GraphQLClient } from "graphql-request";
import { fetch } from "undici";
import { LATEST_SUPERGRAPH_SCHEMA } from "./LatestSupergraphSchema.js";
import { Supergraph } from "@apollo/federation-internals";

import { readFileSync } from "fs";

export const validateSupergraphInput = async (supergraphInput, graphref) => {
  const client = new GraphQLClient(
    "https://graphql.api.apollographql.com/api/graphql",
    {
      fetch,
      headers: {
        "x-api-key": process.env.APOLLO_KEY ?? "",
        ...(process.env.APOLLO_SUDO ? { "apollo-sudo": "true " } : {}),
        "apollo-client-name": "subgraph-requests-from-op",
        "apollo-client-version": "1.0.0",
      },
    }
  );

  let supergraph;

  if (supergraphInput) {
    try {
      const supergraphSdl = readFileSync(supergraphInput, "utf-8");
      supergraph = Supergraph.build(supergraphSdl);
    } catch (err) {
      throw new Error(`Error reading supergraph file: ${err.message}`);
    }
  } else {
    const supergraphResp = await client.request(LATEST_SUPERGRAPH_SCHEMA, {
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
