import type { PersonData, OrgTreeNode, RelationshipType } from "@/types/org-chart";

/**
 * Builds a hierarchical tree structure from a flat array of people.
 * 
 * @param people - Flat array of people data
 * @param relationshipField - Field to use for hierarchy ('reports_to' or 'recruited_by')
 * @returns Array of root nodes with nested children
 */
export function buildOrgTree(
  people: PersonData[],
  relationshipField: RelationshipType
): OrgTreeNode[] {
  // Create a map for quick lookups
  const peopleMap = new Map<string, PersonData>();
  people.forEach((person) => {
    peopleMap.set(person.id, person);
  });

  // Find root nodes (where relationship field is null)
  const rootNodes: OrgTreeNode[] = [];
  const nodeMap = new Map<string, OrgTreeNode>();

  // First pass: create all nodes
  people.forEach((person) => {
    const node: OrgTreeNode = {
      person,
      children: [],
    };
    nodeMap.set(person.id, node);
  });

  // Second pass: build parent-child relationships
  people.forEach((person) => {
    const node = nodeMap.get(person.id);
    if (!node) return;

    const relationshipId =
      relationshipField === "reports_to"
        ? person.reportsToId
        : person.recruitedById;

    if (relationshipId && nodeMap.has(relationshipId)) {
      const parentNode = nodeMap.get(relationshipId);
      if (parentNode) {
        parentNode.children.push(node);
      }
    } else {
      // This is a root node
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

/**
 * Finds the path from root to a target person in the hierarchy.
 * 
 * @param people - Flat array of people data
 * @param personId - Target person ID
 * @param relationshipField - Field to use for hierarchy
 * @returns Array of person IDs from root to target (inclusive)
 */
export function findPersonPath(
  people: PersonData[],
  personId: string,
  relationshipField: RelationshipType
): string[] {
  const peopleMap = new Map<string, PersonData>();
  people.forEach((person) => {
    peopleMap.set(person.id, person);
  });

  const path: string[] = [];
  let currentId: string | null = personId;

  while (currentId) {
    path.unshift(currentId);
    const person = peopleMap.get(currentId);
    if (!person) break;

    currentId =
      relationshipField === "reports_to"
        ? person.reportsToId
        : person.recruitedById;
  }

  return path;
}

/**
 * Recursively filters a tree to only include people from a specific office.
 * 
 * @param tree - Array of root nodes
 * @param officeId - Office ID to filter by
 * @returns Filtered tree structure
 */
export function filterTreeByOffice(
  tree: OrgTreeNode[],
  officeId: string
): OrgTreeNode[] {
  return tree
    .map((node) => {
      // Filter children first
      const filteredChildren = filterTreeByOffice(node.children, officeId);

      // Include node if it matches office OR has matching children
      if (
        node.person.officeId === officeId ||
        filteredChildren.length > 0
      ) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
      return null;
    })
    .filter((node): node is OrgTreeNode => node !== null);
}
