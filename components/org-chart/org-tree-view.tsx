"use client";

import { useEffect, useMemo } from "react";
import type { OrgTreeNode, RelationshipType } from "@/types/org-chart";
import { OrgTreeNode as OrgTreeNodeComponent } from "./org-tree-node";

interface OrgTreeViewProps {
  tree: OrgTreeNode[];
  searchQuery?: string;
  relationshipType: RelationshipType;
  expandedNodes: Map<string, boolean>;
  onExpandedNodesChange: (nodes: Map<string, boolean>) => void;
  focusPersonId?: string | null;
}

export function OrgTreeView({
  tree,
  searchQuery,
  relationshipType,
  expandedNodes,
  onExpandedNodesChange,
  focusPersonId,
}: OrgTreeViewProps) {
  // Compute highlighted paths based on search query or focus
  const highlightedPaths = useMemo(() => {
    const paths = new Set<string>();

    if (focusPersonId) {
      // Highlight the focused person and their entire chain
      paths.add(focusPersonId);
      // Find all ancestors and descendants of focused person
      const findInTree = (nodes: OrgTreeNode[], targetId: string): boolean => {
        for (const node of nodes) {
          if (node.person.id === targetId) return true;
          if (findInTree(node.children, targetId)) {
            paths.add(node.person.id);
            return true;
          }
        }
        return false;
      };
      findInTree(tree, focusPersonId);

      // Also highlight descendants
      const highlightDescendants = (nodes: OrgTreeNode[]) => {
        for (const node of nodes) {
          if (paths.has(node.person.id)) {
            node.children.forEach((child) => {
              paths.add(child.person.id);
            });
          }
          highlightDescendants(node.children);
        }
      };
      highlightDescendants(tree);
    } else if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const findMatches = (nodes: OrgTreeNode[]) => {
        nodes.forEach((node) => {
          const fullName = `${node.person.firstName} ${node.person.lastName}`.toLowerCase();
          const email = node.person.email.toLowerCase();
          if (fullName.includes(query) || email.includes(query)) {
            paths.add(node.person.id);
          }
          findMatches(node.children);
        });
      };
      findMatches(tree);
    }

    return paths;
  }, [tree, searchQuery, focusPersonId]);

  // Auto-expand path to matching nodes when search query or focus exists
  useEffect(() => {
    if (!searchQuery && !focusPersonId) {
      return;
    }

    const expandPathToNode = (
      nodes: OrgTreeNode[],
      targetId: string,
      expanded: Map<string, boolean>
    ): boolean => {
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
    };

    // Expand all paths to highlighted nodes
    const newExpanded = new Map(expandedNodes);
    highlightedPaths.forEach((id) => {
      expandPathToNode(tree, id, newExpanded);
      // Also expand the node itself if it has children
      newExpanded.set(id, true);
    });
    onExpandedNodesChange(newExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, focusPersonId]);

  function toggleNode(nodeId: string) {
    const next = new Map(expandedNodes);
    next.set(nodeId, !next.get(nodeId));
    onExpandedNodesChange(next);
  }

  if (tree.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow">
        <p className="text-gray-500">No people found</p>
      </div>
    );
  }

  // Mark last child in each group
  const treeWithLastChild = tree.map((node, index) => ({
    ...node,
    isLastChild: index === tree.length - 1,
  }));

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="overflow-x-auto">
        {treeWithLastChild.map((node) => (
          <RecursiveTreeNode
            key={node.person.id}
            node={node}
            level={0}
            expandedNodes={expandedNodes}
            onToggle={toggleNode}
            highlightedPaths={highlightedPaths}
            relationshipType={relationshipType}
            isLastChild={node.isLastChild}
            parentLines={[]}
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
  isLastChild,
  parentLines,
}: {
  node: OrgTreeNode;
  level: number;
  expandedNodes: Map<string, boolean>;
  onToggle: (nodeId: string) => void;
  highlightedPaths: Set<string>;
  relationshipType: RelationshipType;
  isLastChild: boolean;
  parentLines: boolean[]; // Track which parent levels need continuing lines
}) {
  const isExpanded = expandedNodes.get(node.person.id) ?? false;
  const isHighlighted = highlightedPaths.has(node.person.id);
  const hasChildren = node.children.length > 0;

  // Track lines for children: add current level's line status
  const childParentLines = [...parentLines, !isLastChild];

  return (
    <div className="relative">
      {/* Tree connecting lines */}
      {level > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex" style={{ width: `${level * 32}px` }}>
          {/* Vertical lines from parent levels */}
          {parentLines.map((showLine, idx) => (
            <div
              key={idx}
              className="w-8 relative"
            >
              {showLine && (
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-300" />
              )}
            </div>
          ))}
          {/* Horizontal connector and vertical line for current level */}
          <div className="w-8 relative">
            {/* Vertical line (extends up, and down if not last) */}
            <div
              className={`absolute left-4 w-px bg-gray-300 ${
                isLastChild ? "top-0 h-6" : "top-0 bottom-0"
              }`}
            />
            {/* Horizontal connector */}
            <div className="absolute left-4 top-6 w-4 h-px bg-gray-300" />
          </div>
        </div>
      )}

      {/* Node content with left margin for lines */}
      <div style={{ marginLeft: `${level * 32}px` }} className="py-1">
        <OrgTreeNodeComponent
          node={node}
          level={level}
          isExpanded={isExpanded}
          onToggle={() => onToggle(node.person.id)}
          isHighlighted={isHighlighted}
          relationshipType={relationshipType}
        />
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child, index) => (
            <RecursiveTreeNode
              key={child.person.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              highlightedPaths={highlightedPaths}
              relationshipType={relationshipType}
              isLastChild={index === node.children.length - 1}
              parentLines={childParentLines}
            />
          ))}
        </div>
      )}
    </div>
  );
}
