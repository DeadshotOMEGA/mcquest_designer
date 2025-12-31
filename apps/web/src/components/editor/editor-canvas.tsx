'use client'

import React, { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnSelectionChangeFunc,
  type OnNodeDrag,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
} from '@xyflow/react'
import { QuestNode as QuestNodeComponent } from './nodes'
import { DependencyEdge as DependencyEdgeComponent, DependencyEdgeMarker } from './edges'
import {
  useEditorStore,
  useSnapshot,
  useSelectedChapterId,
  useSelectedQuestId,
} from '@/lib/store/editor-store'
import {
  snapshotToFlow,
  type QuestFlowNode,
  type DependencyFlowEdge,
} from '@/lib/editor'

/**
 * EditorCanvas - React Flow canvas for the quest graph editor
 *
 * This is the core visual editing surface where quests are displayed as nodes
 * and dependencies as edges.
 *
 * Implemented (M2):
 * - Custom QuestNode component (#19)
 * - Custom DependencyEdge component (#20)
 * - Snapshot-to-ReactFlow mapping (#21)
 * - Selection sync with store (#24)
 * - Node drag and position updates (#26)
 */

/**
 * Node types registry for React Flow
 * Must be defined outside component or memoized to prevent infinite re-renders
 */
const nodeTypes: NodeTypes = {
  quest: QuestNodeComponent,
}

/**
 * Edge types registry for React Flow
 */
const edgeTypes: EdgeTypes = {
  dependency: DependencyEdgeComponent,
}

interface EditorCanvasProps {
  projectId: string
}

export function EditorCanvas({ projectId: _projectId }: EditorCanvasProps) {
  // Get snapshot and selection state from store
  const snapshot = useSnapshot()
  const selectedChapterId = useSelectedChapterId()
  const selectedQuestId = useSelectedQuestId()

  // Get store actions
  const updateQuest = useEditorStore((state) => state.updateQuest)
  const selectQuest = useEditorStore((state) => state.selectQuest)

  // Convert snapshot to React Flow nodes and edges
  // Memoize to avoid recalculating on every render
  const { nodes, edges } = useMemo<{
    nodes: QuestFlowNode[]
    edges: DependencyFlowEdge[]
  }>(() => {
    if (!snapshot || !selectedChapterId) {
      return { nodes: [], edges: [] }
    }

    return snapshotToFlow(snapshot, {
      activeChapterId: selectedChapterId,
    })
  }, [snapshot, selectedChapterId])

  // Apply selection state to nodes
  const nodesWithSelection = useMemo<QuestFlowNode[]>(() => {
    return nodes.map((node) => ({
      ...node,
      selected: node.id === selectedQuestId,
    }))
  }, [nodes, selectedQuestId])

  // Handle node changes (position, selection from React Flow internal state)
  const onNodesChange: OnNodesChange<QuestFlowNode> = useCallback(
    (changes) => {
      // Apply changes to get the new nodes state
      // Note: We don't actually update React Flow's internal state here
      // since we're using the snapshot as the source of truth
      // Position changes are handled by onNodeDragStop
      applyNodeChanges(changes, nodesWithSelection)
    },
    [nodesWithSelection]
  )

  // Handle edge changes
  const onEdgesChange: OnEdgesChange<DependencyFlowEdge> = useCallback(
    (changes) => {
      // Apply changes - currently just for internal React Flow state
      applyEdgeChanges(changes, edges)
    },
    [edges]
  )

  // Handle node drag - update quest position in store when drag ends
  const onNodeDragStop: OnNodeDrag<QuestFlowNode> = useCallback(
    (_event, node) => {
      // Update the quest position in the store
      // Snap to grid is already applied by React Flow
      updateQuest(node.id, {
        position: {
          x: node.position.x,
          y: node.position.y,
        },
      })
    },
    [updateQuest]
  )

  // Handle selection changes from React Flow
  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selectedNodes }) => {
      // Sync selection to store
      // Only handle single selection for now
      if (selectedNodes.length === 1) {
        const selectedNode = selectedNodes[0]
        if (selectedNode.id !== selectedQuestId) {
          selectQuest(selectedNode.id)
        }
      } else if (selectedNodes.length === 0 && selectedQuestId !== null) {
        // Clear selection when nothing is selected
        selectQuest(null)
      }
      // Multi-selection: keep the first selected node
      // Future enhancement could support multi-select
    },
    [selectedQuestId, selectQuest]
  )

  return (
    <div className="h-full w-full">
      {/* SVG marker definitions for arrow heads */}
      <DependencyEdgeMarker />

      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </div>
  )
}
