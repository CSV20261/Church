'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { createClient } from '@/lib/supabase/client';
import HierarchyNode from './HierarchyNode';
import HierarchyNodeDetails from './HierarchyNodeDetails';

// Define custom node type
type HierarchyNodeType = Node<{
  label: string;
  level: string;
  levelLabel: string;
  leader: string;
  location?: string;
  colors: { bg: string; border: string; text: string };
  rawData: Record<string, unknown>;
}>;

// Node types configuration
const nodeTypes: NodeTypes = {
  hierarchy: HierarchyNode,
};

// Color scheme for different hierarchy levels
const levelColors: Record<string, { bg: string; border: string; text: string }> = {
  apostleship: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' },      // Red
  overseership: { bg: '#f5f3ff', border: '#7c3aed', text: '#5b21b6' },     // Purple
  eldership: { bg: '#fdf4ff', border: '#c026d3', text: '#86198f' },        // Pink/Fuchsia
  priestship: { bg: '#ecfdf5', border: '#10b981', text: '#065f46' },       // Green
};

export interface HierarchyData {
  apostleships: any[];
  overseerships: any[];
  elderships: any[];
  priestships: any[];
}

interface HierarchyCanvasProps {
  initialData?: HierarchyData;
  userAssignmentId?: string | null;
}

export default function HierarchyCanvas({ initialData, userAssignmentId }: HierarchyCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<HierarchyNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<HierarchyNodeType | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [hierarchyData, setHierarchyData] = useState<HierarchyData | null>(initialData || null);

  const supabase = createClient();

  // Fetch hierarchy data from Supabase
  const fetchHierarchyData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching hierarchy data...');

      const [apostleshipRes, overseershipsRes, eldershipsRes, priestshipsRes] = await Promise.all([
        supabase.from('apostleship').select('*, apostle:apostle_id(id, full_name)'),
        supabase.from('overseerships').select('*, overseer:overseer_id(id, full_name)'),
        supabase.from('elderships').select('*, elder:elder_id(id, full_name)'),
        supabase.from('priestships').select('*, priest:priest_id(id, full_name)'),
      ]);

      console.log('Apostleships:', apostleshipRes.data, apostleshipRes.error);
      console.log('Overseerships:', overseershipsRes.data, overseershipsRes.error);
      console.log('Elderships:', eldershipsRes.data, eldershipsRes.error);
      console.log('Priestships:', priestshipsRes.data, priestshipsRes.error);

      if (apostleshipRes.error) throw new Error(`Apostleship: ${apostleshipRes.error.message}`);
      if (overseershipsRes.error) throw new Error(`Overseerships: ${overseershipsRes.error.message}`);
      if (eldershipsRes.error) throw new Error(`Elderships: ${eldershipsRes.error.message}`);
      if (priestshipsRes.error) throw new Error(`Priestships: ${priestshipsRes.error.message}`);

      const data: HierarchyData = {
        apostleships: apostleshipRes.data || [],
        overseerships: overseershipsRes.data || [],
        elderships: eldershipsRes.data || [],
        priestships: priestshipsRes.data || [],
      };

      setHierarchyData(data);
      buildGraph(data);
    } catch (err) {
      console.error('Error fetching hierarchy:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hierarchy');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Build nodes and edges from hierarchy data
  const buildGraph = useCallback((data: HierarchyData) => {
    const newNodes: HierarchyNodeType[] = [];
    const newEdges: Edge[] = [];

    // Layout configuration
    const horizontalSpacing = 280;
    const verticalSpacing = 150;
    
    // Track positions per level for horizontal distribution
    const levelCounts = {
      apostleship: 0,
      overseership: 0,
      eldership: 0,
      priestship: 0,
    };

    // Calculate total width needed per level
    const getHorizontalOffset = (index: number, total: number): number => {
      if (total === 0) return 0;
      const totalWidth = (total - 1) * horizontalSpacing;
      return (index * horizontalSpacing) - (totalWidth / 2);
    };

    // Level 0: Apostleships (top)
    data.apostleships.forEach((apostleship, index) => {
      const leaderName = apostleship.apostle?.full_name || 'No leader assigned';
      
      newNodes.push({
        id: `apostleship-${apostleship.id}`,
        type: 'hierarchy',
        position: { 
          x: getHorizontalOffset(index, data.apostleships.length), 
          y: 0 
        },
        data: {
          label: apostleship.name,
          level: 'apostleship',
          levelLabel: 'Apostleship',
          leader: leaderName,
          colors: levelColors.apostleship,
          rawData: apostleship,
        },
      });
    });

    // Level 1: Overseerships
    data.overseerships.forEach((overseership, index) => {
      const leaderName = overseership.overseer?.full_name || 'No leader assigned';
      
      newNodes.push({
        id: `overseership-${overseership.id}`,
        type: 'hierarchy',
        position: { 
          x: getHorizontalOffset(index, data.overseerships.length), 
          y: verticalSpacing 
        },
        data: {
          label: overseership.name,
          level: 'overseership',
          levelLabel: 'Overseership',
          leader: leaderName,
          location: overseership.location,
          colors: levelColors.overseership,
          rawData: overseership,
        },
      });

      // Edge from apostleship to overseership
      if (overseership.apostleship_id) {
        newEdges.push({
          id: `e-apostleship-${overseership.apostleship_id}-overseership-${overseership.id}`,
          source: `apostleship-${overseership.apostleship_id}`,
          target: `overseership-${overseership.id}`,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#7c3aed' },
          style: { stroke: '#7c3aed', strokeWidth: 2 },
        });
      }
    });

    // Level 2: Elderships
    // Group elderships by overseership for better layout
    const eldershipsByOverseership = new Map<string, any[]>();
    data.elderships.forEach(eldership => {
      const key = eldership.overseership_id || 'none';
      if (!eldershipsByOverseership.has(key)) {
        eldershipsByOverseership.set(key, []);
      }
      eldershipsByOverseership.get(key)!.push(eldership);
    });

    let eldershipIndex = 0;
    data.elderships.forEach((eldership) => {
      const leaderName = eldership.elder?.full_name || 'No leader assigned';
      
      newNodes.push({
        id: `eldership-${eldership.id}`,
        type: 'hierarchy',
        position: { 
          x: getHorizontalOffset(eldershipIndex, data.elderships.length), 
          y: verticalSpacing * 2 
        },
        data: {
          label: eldership.name,
          level: 'eldership',
          levelLabel: 'Eldership',
          leader: leaderName,
          location: eldership.location,
          colors: levelColors.eldership,
          rawData: eldership,
        },
      });
      eldershipIndex++;

      // Edge from overseership to eldership
      if (eldership.overseership_id) {
        newEdges.push({
          id: `e-overseership-${eldership.overseership_id}-eldership-${eldership.id}`,
          source: `overseership-${eldership.overseership_id}`,
          target: `eldership-${eldership.id}`,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#c026d3' },
          style: { stroke: '#c026d3', strokeWidth: 2 },
        });
      }
    });

    // Level 3: Priestships
    let priestshipIndex = 0;
    data.priestships.forEach((priestship) => {
      const leaderName = priestship.priest?.full_name || 'No leader assigned';
      
      newNodes.push({
        id: `priestship-${priestship.id}`,
        type: 'hierarchy',
        position: { 
          x: getHorizontalOffset(priestshipIndex, data.priestships.length), 
          y: verticalSpacing * 3 
        },
        data: {
          label: priestship.name,
          level: 'priestship',
          levelLabel: 'Priestship',
          leader: leaderName,
          location: priestship.location || priestship.meeting_address,
          colors: levelColors.priestship,
          rawData: priestship,
        },
      });
      priestshipIndex++;

      // Edge from eldership to priestship
      if (priestship.eldership_id) {
        newEdges.push({
          id: `e-eldership-${priestship.eldership_id}-priestship-${priestship.id}`,
          source: `eldership-${priestship.eldership_id}`,
          target: `priestship-${priestship.id}`,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
          style: { stroke: '#10b981', strokeWidth: 2 },
        });
      }
    });

    console.log('Built graph:', { nodes: newNodes.length, edges: newEdges.length });
    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  // Fetch data on mount
  useEffect(() => {
    if (initialData) {
      buildGraph(initialData);
      setLoading(false);
    } else {
      fetchHierarchyData();
    }
  }, [initialData, fetchHierarchyData, buildGraph]);

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: HierarchyNodeType) => {
    setSelectedNode(node);
  }, []);

  // Close details panel
  const closeDetails = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-50 rounded-xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading church hierarchy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-red-50 rounded-xl">
        <div className="text-center p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800">Failed to load hierarchy</h3>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={fetchHierarchyData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-gray-50 rounded-xl overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => levelColors[node.data?.level as string]?.border || '#888'}
          maskColor="rgba(0,0,0,0.1)"
        />
        
        {/* Legend Panel */}
        <Panel position="top-left" className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Hierarchy Levels</h4>
          <div className="space-y-1">
            {Object.entries(levelColors).map(([level, colors]) => (
              <div key={level} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: colors.border }}
                />
                <span className="capitalize text-gray-600">{level}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Stats Panel */}
        <Panel position="top-right" className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Structure</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p>Apostleships: {hierarchyData?.apostleships.length || 0}</p>
            <p>Overseerships: {hierarchyData?.overseerships.length || 0}</p>
            <p>Elderships: {hierarchyData?.elderships.length || 0}</p>
            <p>Priestships: {hierarchyData?.priestships.length || 0}</p>
          </div>
        </Panel>

        {/* Debug Panel */}
        <Panel position="bottom-left">
          <button
            onClick={() => setDebugOpen(!debugOpen)}
            className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {debugOpen ? 'Hide Debug' : 'Show Debug'}
          </button>
          {debugOpen && (
            <div className="mt-2 bg-gray-900 text-green-400 text-xs p-3 rounded-lg max-w-md max-h-48 overflow-auto font-mono">
              <p>Nodes: {nodes.length}</p>
              <p>Edges: {edges.length}</p>
              <p>---</p>
              <p>Node IDs: {nodes.map(n => n.id).join(', ') || 'none'}</p>
              <p>---</p>
              <p>Relationships:</p>
              {edges.map(e => (
                <p key={e.id}>{e.source} → {e.target}</p>
              ))}
            </div>
          )}
        </Panel>
      </ReactFlow>

      {/* Node Details Panel */}
      {selectedNode && (
        <HierarchyNodeDetails 
          node={selectedNode} 
          onClose={closeDetails}
        />
      )}
    </div>
  );
}
