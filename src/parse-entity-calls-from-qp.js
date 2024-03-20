/**
 * @param {import("@apollo/federation-internals").Supergraph} supergraph
 * @param {import("graphql").DocumentNode} doc
 * @param {import("@apollo/query-planner").QueryPlanner} queryPlanner
 */
export function parseEntityCalls(queryPlan) {
  assert(queryPlan.node, "query plan node missing");
	const parsedEntityCalls = _collectFetchOperations(queryPlan.node);

	return parsedEntityCalls;
}

/**
 * @param {Array} requires - The requires field from a fetch node.
 * @returns {Object}
 */
function processRequires(requires) {
  const results = [];
  requires.forEach((r) => {
		const result = {};
    if (r.kind === "InlineFragment") {
      r.selections.forEach((s) => {
        if (s.kind === "Field") {
					if (s.name === "__typename") {
						result[s.name] = r.typeCondition; // Assuming a placeholder value for simplicity
					} else {
						result[s.name] = "USE_REAL_DATA"
					}
				}
      });
    }

		results.push(result);
  });
  return results;
}

/**
 * @param {import("@apollo/query-planner").PlanNode | null | undefined} node
 * @returns {Object[]}
 */
function _collectFetchOperations(node) {
  let operations = [];

  if (!node) return operations;

  switch (node.kind) {
    case "Fetch": {
      if (node.operation.includes("_entities")) {
        operations.push({
          operation: node.operation,
					operationName: node.operationName,
					subgraphName: node.serviceName,
          variables: {
						representations: processRequires(node.requires)
					}
        });
      }
      break;
    }
    case "Sequence":
    case "Parallel":
      operations = operations.concat(...node.nodes.map((n) => _collectFetchOperations(n)));
      break;
    case "Defer":
      operations = operations.concat(
        _collectFetchOperations(node.primary.node),
        ...node.deferred.map((n) => _collectFetchOperations(n.node))
      );
      break;
    case "Flatten":
      operations = operations.concat(_collectFetchOperations(node.node));
      break;
    case "Condition":
      operations = operations.concat(
        _collectFetchOperations(node.ifClause),
        _collectFetchOperations(node.elseClause)
      );
      break;
  }

  return operations;
}

/**
 * Assert function remains unchanged.
 * @param {any} cond
 * @param {string} msg
 * @returns {asserts cond}
 */
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
