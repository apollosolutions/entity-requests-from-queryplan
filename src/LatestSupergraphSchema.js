import { gql } from "graphql-tag";

export const LATEST_SUPERGRAPH_SCHEMA = gql`
query LatestSupergraphSchema($ref: ID!) {
  variant(ref: $ref) {
    __typename
    ... on GraphVariant {
      latestApprovedLaunch {
        build {
          result {
            __typename
            ... on BuildSuccess {
              coreSchema {
                coreDocument
              }
            }
          }
        }
      }
    }
  }
}
`;