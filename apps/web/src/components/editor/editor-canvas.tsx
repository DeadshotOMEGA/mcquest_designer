'use client'

import React, { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
  type OnSelectionChangeFunc,
  type OnNodeDrag,
  BackgroundVariant,
} from '@xyflow/react'
import { QuestNode as QuestNodeComponent, CompactQuestNode as CompactQuestNodeComponent } from './nodes'
import { DependencyEdge as DependencyEdgeComponent, DependencyEdgeMarker } from './edges'
import {
  useEditorStore,
  useSnapshot,
  useSelectedChapterId,
  useSelectedQuestId,
  useCanUndo,
  useCanRedo,
  useIsArranging,
  useQuest,
} from '@/lib/store/editor-store'
import {
  snapshotToFlow,
  type QuestFlowNode,
  type DependencyFlowEdge,
} from '@/lib/editor'
import { createDefaultQuest } from '@mcquest/schema'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditorToolbar } from './editor-toolbar'
import { QuestDetailsModal } from './quest-details-modal'

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
  'quest-node': QuestNodeComponent,
  'compact-quest-node': CompactQuestNodeComponent,
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
  const selectedQuest = useQuest(selectedQuestId ?? '')

  // Get undo/redo state
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const isArranging = useIsArranging()

  // Get store actions
  const updateQuest = useEditorStore((state) => state.updateQuest)
  const selectQuest = useEditorStore((state) => state.selectQuest)
  const addQuest = useEditorStore((state) => state.addQuest)
  const applyAutoLayout = useEditorStore((state) => state.applyAutoLayout)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const setArranging = useEditorStore((state) => state.setArranging)

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

  // Handle adding a new quest at a default position
  const handleAddQuest = useCallback(() => {
    if (!selectedChapterId) return

    // Create quest at a default position
    // Users can drag to reposition as needed
    const position = {
      x: 100,
      y: 100,
    }

    const newQuest = createDefaultQuest(
      selectedChapterId,
      'New Quest',
      position
    )

    addQuest(newQuest)
  }, [selectedChapterId, addQuest])

  // Handle auto-arrange callback from toolbar
  const handleAutoArrange = useCallback(() => {
    setArranging(true)
    try {
      applyAutoLayout()
    } finally {
      // Reset arranging state after a short delay to allow animation
      setTimeout(() => setArranging(false), 300)
    }
  }, [applyAutoLayout, setArranging])

  // Handle quest details modal close
  const handleModalClose = useCallback(() => {
    selectQuest(null)
  }, [selectQuest])

  // Handle quest save from modal
  const handleQuestSave = useCallback(
    (updatedQuest: typeof selectedQuest) => {
      if (!updatedQuest) return
      updateQuest(updatedQuest.id, updatedQuest)
    },
    [updateQuest]
  )

  return (
    <div className="h-full w-full relative">
      {/* SVG marker definitions for arrow heads */}
      <DependencyEdgeMarker />

      {/* Editor Toolbar - positioned absolutely above canvas */}
      <EditorToolbar
        activeChapterId={selectedChapterId}
        onAutoArrange={handleAutoArrange}
        isArranging={isArranging}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
      />

      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
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

      {/* Floating Add Quest button */}
      <Button
        onClick={handleAddQuest}
        disabled={!selectedChapterId}
        className="absolute bottom-6 left-6 h-12 w-12 rounded-full shadow-lg z-10"
        size="icon"
        aria-label="Add new quest"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Quest Details Modal - opens when quest is selected */}
      <QuestDetailsModal
        quest={selectedQuest ?? null}
        isOpen={selectedQuestId !== null}
        onClose={handleModalClose}
        onSave={handleQuestSave}
        mode="view"
      />
    </div>
  )
}
