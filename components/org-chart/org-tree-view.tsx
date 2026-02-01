"use client";

import { useState, useEffect } from "react";
import type { OrgTreeNode, RelationshipType } from "@/types/org-chart";
import { OrgTreeNode as OrgTreeNodeComponent } from "./org-tree-node";

interface OrgTreeViewProps {
  tree: OrgTreeNode[];
  searchQuery?: string;
  relationshipType: RelationshipType;
}

export function OrgTreeView({
  tree,
  searchQuery,
  relationshipType,
}: OrgTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Map<string, boolean>>(
    new Map()
  );
  const [highlightedPaths, setHighlightedPaths] = useState<Set<string>>(
    new Set()
  );

  // Auto-expand path to matching nodes when search query exists
  useEffect(() => {
    if (!searchQuery) {
      setHighlightedPaths(new Set());
      return;
    }

    // Flatten tree to get all people
    const flattenTree = (nodes: OrgTreeNode[]): string[] => {
      const ids: string[] = [];
      nodes.forEach((node) => {
        ids.push(node.person.id);
        ids.push(...flattenTree(node.children));
      });
      return ids;
    };

    const allPersonIds = flattenTree(tree);

    // For now, we'll highlight all nodes that match the search
    // In a real implementation, you'd want to get the full people array
    // and use findPersonPath to get the exact path
    const matchingIds = allPersonIds.filter((id) => {
      const node = findNodeById(tree, id);
      if (!node) return false;
      const fullName = `${node.person.firstName} ${node.person.lastName}`.toLowerCase();
      const email = node.person.email.toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });

    // Expand all paths to matching nodes
    const newExpanded = new Map(expandedNodes);
    matchingIds.forEach((id) => {
      expandPathToNode(tree, id, newExpanded);
    });
    setExpandedNodes(newExpanded);
    setHighlightedPaths(new Set(matchingIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  function findNodeById(nodes: OrgTreeNode[], id: string): OrgTreeNode | null {
    for (const node of nodes) {
      if (node.person.id === id) return node;
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
    return null;
  }

  function expandPathToNode(
    nodes: OrgTreeNode[],
    targetId: string,
    expanded: Map<string, boolean>
  ): boolean {
    for (const node of nodes) {
      if (node.person.id === targetId) {
        return true;
      }
      if (expandPathToNode(node.children, targetId, expanded)) {
        expanded.set(node.person.id, true);
        return true;
      }
    }
    return false;
  }

  function toggleNode(nodeId: string) {
    setExpandedNodes((prev) => {
      const next = new Map(prev);
      next.set(nodeId, !next.get(nodeId));
      return next;
    });
  }

  if (tree.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow">
        <p className="text-gray-500">No people found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="space-y-3 overflow-x-auto">
        {tree.map((node) => (
          <RecursiveTreeNode
            key={node.person.id}
            node={node}
            level={0}
            expandedNodes={expandedNodes}
            onToggle={toggleNode}
            highlightedPaths={highlightedPaths}
            relationshipType={relationshipType}
          />
        ))}
      </div>
    </div>
  );
}

function RecursiveTreeNode({
  node,
  level,
  expandedNodes,
  onToggle,
  highlightedPaths,
  relationshipType,
}: {
  node: OrgTreeNode;
  level: number;
  expandedNodes: Map<string, boolean>;
  onToggle: (nodeId: string) => void;
  highlightedPaths: Set<string>;
  relationshipType: RelationshipType;
}) {
  const isExpanded = expandedNodes.get(node.person.id) ?? false;
  const isHighlighted = highlightedPaths.has(node.person.id);

  return (
    <div>
      <OrgTreeNodeComponent
        node={node}
        level={level}
        isExpanded={isExpanded}
        onToggle={() => onToggle(node.person.id)}
        isHighlighted={isHighlighted}
        relationshipType={relationshipType}
      />
      {isExpanded && node.children.length > 0 && (
        <div className="ml-8 mt-2 space-y-2">
          {node.children.map((child) => (
            <RecursiveTreeNode
              key={child.person.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              highlightedPaths={highlightedPaths}
              relationshipType={relationshipType}
            />
          ))}
        </div>
      )}
    </div>
  );
}
