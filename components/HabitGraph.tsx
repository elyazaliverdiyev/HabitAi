import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    useNodesState,
    useEdgesState,
    Connection,
    MarkerType,
    BackgroundVariant,
    NodeProps,
    Handle,
    Position,
    NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Habit, HabitConnection, CONNECTION_TYPES } from '../types';
import { Unlink, Flame, Sparkles, Loader2, CheckCircle2, MoreVertical, Eye, Edit3, Trash2, Link2, Check } from 'lucide-react';
import { suggestHabitConnections } from '../services/ai';
import Icon from './Icons';

interface HabitGraphProps {
    habits: Habit[];
    connections: HabitConnection[];
    onConnectionsChange: (connections: HabitConnection[]) => void;
    nodePositions: Record<string, { x: number; y: number }>;
    onNodePositionsChange: (positions: Record<string, { x: number; y: number }>) => void;
    language: 'ru' | 'en';
    onHabitClick?: (habit: Habit) => void;
    onHabitEdit?: (habit: Habit) => void;
    onHabitDelete?: (habitId: string) => void;
    onHabitComplete?: (habitId: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CATEGORY_COLORS: Record<string, string> = {
    'Здоровье': '#ef4444', 'Health': '#ef4444',
    'Спорт': '#f97316', 'Fitness': '#f97316',
    'Продуктивность': '#3b82f6', 'Productivity': '#3b82f6',
    'Обучение': '#8b5cf6', 'Learning': '#8b5cf6',
    'Финансы': '#22c55e', 'Finance': '#22c55e',
    'Осознанность': '#ec4899', 'Mindfulness': '#ec4899',
};

// Node with menu button
const HabitNode: React.FC<NodeProps> = ({ data }) => {
    const todayStr = getLocalDateString();
    const isCompletedToday = data.completedDates?.includes(todayStr);
    const streak = data.completedDates?.length || 0;
    const categoryColor = CATEGORY_COLORS[data.category] || '#6366f1';
    const isEmoji = data.icon && data.icon.match(/\p{Emoji}/u) && !data.icon.match(/^[A-Z]/);

    const handleMenuClick = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (data.onMenuClick) {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            data.onMenuClick(data.id, rect.right, rect.bottom);
        }
    };

    return (
        <div
            className="select-none relative"
            style={{
                filter: isCompletedToday ? `drop-shadow(0 0 8px ${categoryColor}60)` : undefined,
            }}
        >
            <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl cursor-grab active:cursor-grabbing relative"
                style={{
                    background: isCompletedToday
                        ? `linear-gradient(135deg, ${categoryColor}25, ${categoryColor}10)`
                        : 'linear-gradient(135deg, #2a2a3e, #1e1e2e)',
                    border: `1.5px solid ${isCompletedToday ? categoryColor : categoryColor + '50'}`,
                    minWidth: '90px',
                    maxWidth: '130px',
                }}
            >
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!w-2 !h-2"
                    style={{ background: categoryColor, border: 'none' }}
                />

                {/* Icon */}
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${categoryColor}25` }}
                >
                    {isEmoji ? (
                        <span className="text-base">{data.icon}</span>
                    ) : (
                        <Icon name={data.icon || 'Zap'} size={14} className="text-white" />
                    )}
                </div>

                {/* Text */}
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-[10px] text-white truncate leading-tight">
                        {data.name}
                    </span>
                    {streak > 0 && (
                        <div className="flex items-center gap-0.5">
                            <Flame size={8} className="text-orange-400" />
                            <span className="text-[8px] font-bold text-orange-400">{streak}</span>
                            {isCompletedToday && <CheckCircle2 size={8} className="text-green-400 ml-0.5" />}
                        </div>
                    )}
                </div>

                {/* Menu Button - Always visible */}
                <button
                    onClick={handleMenuClick}
                    onTouchEnd={handleMenuClick}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors shrink-0 touch-manipulation"
                    style={{ pointerEvents: 'all' }}
                >
                    <MoreVertical size={12} className="text-white/60" />
                </button>

                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-2 !h-2"
                    style={{ background: categoryColor, border: 'none' }}
                />
            </div>
        </div>
    );
};

const nodeTypes = { habit: HabitNode };

const HabitGraph: React.FC<HabitGraphProps> = ({
    habits,
    connections,
    onConnectionsChange,
    nodePositions,
    onNodePositionsChange,
    language,
    onHabitClick,
    onHabitEdit,
    onHabitDelete,
    onHabitComplete
}) => {
    const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<Array<{
        sourceId: string;
        targetId: string;
        type: 'triggers' | 'enables' | 'blocks' | 'related';
        reasoning: string;
    }>>([]);
    const [menuState, setMenuState] = useState<{ x: number; y: number; habitId: string } | null>(null);

    // Habit Stacking mode - when user wants to stack habits
    const [stackingSource, setStackingSource] = useState<string | null>(null);

    // Handle menu click from node
    const handleNodeMenuClick = useCallback((habitId: string, x: number, y: number) => {
        // If in stacking mode, create connection
        if (stackingSource && stackingSource !== habitId) {
            const exists = connections.some(c => c.sourceId === stackingSource && c.targetId === habitId);
            if (!exists) {
                onConnectionsChange([...connections, {
                    id: generateId(),
                    sourceId: stackingSource,
                    targetId: habitId,
                    type: 'triggers', // Habit stacking = triggers
                    strength: 2,
                }]);
            }
            setStackingSource(null);
            return;
        }
        setMenuState({ x, y, habitId });
    }, [stackingSource, connections, onConnectionsChange]);

    // Build nodes with menu callback
    const initialNodes: Node[] = useMemo(() => {
        const byCategory: Record<string, Habit[]> = {};
        habits.forEach(h => {
            const cat = h.category || 'Other';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(h);
        });

        const categories = Object.keys(byCategory);
        const nodes: Node[] = [];
        let currentY = 50;
        const nodeWidth = 150;
        const nodeHeight = 55;
        const gap = 15;

        categories.forEach(category => {
            const categoryHabits = byCategory[category];
            const cols = Math.min(categoryHabits.length, 3);

            categoryHabits.forEach((habit, idx) => {
                const savedPos = nodePositions[habit.id];
                const col = idx % cols;
                const row = Math.floor(idx / cols);
                const defaultPos = { x: 50 + col * (nodeWidth + gap), y: currentY + row * (nodeHeight + gap) };

                nodes.push({
                    id: habit.id,
                    type: 'habit',
                    position: savedPos || defaultPos,
                    data: {
                        ...habit,
                        onMenuClick: handleNodeMenuClick
                    },
                });
            });

            if (!Object.keys(nodePositions).length) {
                const rows = Math.ceil(categoryHabits.length / cols);
                currentY += rows * (nodeHeight + gap) + 35;
            }
        });

        return nodes;
    }, [habits, nodePositions, handleNodeMenuClick]);

    const initialEdges: Edge[] = useMemo(() => {
        return connections.map(conn => ({
            id: conn.id,
            source: conn.sourceId,
            target: conn.targetId,
            type: 'smoothstep',
            animated: conn.type === 'triggers',
            style: { stroke: CONNECTION_TYPES[conn.type].color, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: CONNECTION_TYPES[conn.type].color, width: 10, height: 10 },
        }));
    }, [connections]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Save positions on drag end - MORE RELIABLE detection
    const handleNodesChange = useCallback((changes: NodeChange[]) => {
        onNodesChange(changes);

        // Check for position changes where dragging just ended
        const hasPositionChange = changes.some(c =>
            c.type === 'position' && c.dragging === false
        );

        if (hasPositionChange) {
            // Debounce the save
            setTimeout(() => {
                setNodes(current => {
                    const newPositions: Record<string, { x: number; y: number }> = {};
                    current.forEach(n => { newPositions[n.id] = n.position; });
                    console.log('Saving positions:', newPositions); // Debug
                    onNodePositionsChange(newPositions);
                    return current;
                });
            }, 50);
        }
    }, [onNodesChange, setNodes, onNodePositionsChange]);

    useEffect(() => {
        setNodes(initialNodes);
    }, [initialNodes, setNodes]);

    useEffect(() => { setEdges(initialEdges); }, [initialEdges, setEdges]);

    const onConnect = useCallback((params: Connection) => {
        if (!params.source || !params.target) return;
        if (connections.some(c => c.sourceId === params.source && c.targetId === params.target)) return;

        onConnectionsChange([...connections, {
            id: generateId(),
            sourceId: params.source,
            targetId: params.target,
            type: 'triggers',
            strength: 2,
        }]);
    }, [connections, onConnectionsChange]);

    const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
        setSelectedConnection(edge.id === selectedConnection ? null : edge.id);
    }, [selectedConnection]);

    const deleteConnection = () => {
        if (!selectedConnection) return;
        onConnectionsChange(connections.filter(c => c.id !== selectedConnection));
        setSelectedConnection(null);
    };

    const changeConnectionType = (type: HabitConnection['type']) => {
        if (!selectedConnection) return;
        onConnectionsChange(connections.map(c => c.id === selectedConnection ? { ...c, type } : c));
    };

    // AI Suggestions
    const handleAiSuggest = async () => {
        setIsAiLoading(true);
        setAiSuggestions([]);
        try {
            const suggestions = await suggestHabitConnections(habits, connections, language);
            setAiSuggestions(suggestions);
        } catch (e) {
            console.error("AI suggestion error", e);
        }
        setIsAiLoading(false);
    };

    const applyAiSuggestion = (suggestion: typeof aiSuggestions[0]) => {
        if (connections.some(c => c.sourceId === suggestion.sourceId && c.targetId === suggestion.targetId)) return;
        onConnectionsChange([...connections, {
            id: generateId(),
            sourceId: suggestion.sourceId,
            targetId: suggestion.targetId,
            type: suggestion.type,
            strength: 2,
        }]);
        setAiSuggestions(prev => prev.filter(s => s !== suggestion));
    };

    const closeMenu = () => setMenuState(null);

    if (habits.length === 0) {
        return (
            <div className="h-[400px] flex items-center justify-center rounded-2xl" style={{ background: '#1a1a2e' }}>
                <div className="text-center text-white/50">
                    <Sparkles size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm">{language === 'ru' ? 'Нет привычек' : 'No habits'}</p>
                </div>
            </div>
        );
    }

    // Legend labels - FULL words
    const legendItems = [
        { type: 'triggers', icon: '→', label: language === 'ru' ? 'Запускает' : 'Triggers' },
        { type: 'enables', icon: '↗', label: language === 'ru' ? 'Помогает' : 'Enables' },
        { type: 'blocks', icon: '✕', label: language === 'ru' ? 'Мешает' : 'Blocks' },
        { type: 'related', icon: '↔', label: language === 'ru' ? 'Связано' : 'Related' },
    ];

    return (
        <div className="relative">
            <div
                className="h-[450px] rounded-2xl overflow-hidden border border-white/10"
                style={{ background: 'linear-gradient(180deg, #1a1a2e, #12121f)' }}
            >
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onEdgeClick={onEdgeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    panOnScroll={false}
                    panOnDrag={true}
                    zoomOnScroll={false}
                    zoomOnPinch={true}
                    zoomOnDoubleClick={false}
                    preventScrolling={false}
                    nodesDraggable={true}
                    minZoom={0.3}
                    maxZoom={2}
                    defaultEdgeOptions={{ type: 'smoothstep' }}
                >
                    <Controls
                        className="!bg-[#2a2a3e] !border-white/10 !rounded-lg [&>button]:!bg-[#2a2a3e] [&>button]:!border-white/10 [&>button]:!text-white/60"
                        showInteractive={false}
                    />
                </ReactFlow>

                {/* AI Button */}
                <button
                    onClick={handleAiSuggest}
                    disabled={isAiLoading || habits.length < 2}
                    className="gemini-glow-sm gemini-glow-bare absolute top-3 right-3 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold text-xs shadow-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-1.5 z-20"
                >
                    {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    AI
                </button>

                {/* Legend - FULL WORDS */}
                <div className="absolute top-3 left-12 flex flex-wrap gap-1 z-10 max-w-[220px]">
                    {legendItems.map(item => (
                        <div
                            key={item.type}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                            style={{
                                backgroundColor: CONNECTION_TYPES[item.type as keyof typeof CONNECTION_TYPES].color + '25',
                                color: CONNECTION_TYPES[item.type as keyof typeof CONNECTION_TYPES].color
                            }}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stacking Mode Indicator */}
            {stackingSource && (
                <div className="mt-3 bg-purple-500/20 border border-purple-500/30 rounded-xl p-3 flex items-center gap-3">
                    <Link2 size={18} className="text-purple-400" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-white">
                            {language === 'ru' ? 'Режим связывания' : 'Stacking Mode'}
                        </p>
                        <p className="text-xs text-white/60">
                            {language === 'ru'
                                ? `Нажмите на привычку которая будет ПОСЛЕ "${habits.find(h => h.id === stackingSource)?.name}"`
                                : `Tap the habit that comes AFTER "${habits.find(h => h.id === stackingSource)?.name}"`
                            }
                        </p>
                    </div>
                    <button
                        onClick={() => setStackingSource(null)}
                        className="px-3 py-1 bg-white/10 text-white/60 rounded-lg text-xs hover:bg-white/20"
                    >
                        {language === 'ru' ? 'Отмена' : 'Cancel'}
                    </button>
                </div>
            )}

            {/* Context Menu */}
            {menuState && (
                <>
                    <div className="fixed inset-0 z-50" onClick={closeMenu} onTouchEnd={closeMenu} />
                    <div
                        className="fixed z-50 bg-[#2a2a3e] border border-white/20 rounded-xl shadow-2xl py-1 min-w-[150px]"
                        style={{
                            top: Math.min(menuState.y, window.innerHeight - 220),
                            left: Math.min(menuState.x, window.innerWidth - 160)
                        }}
                    >
                        {/* Complete */}
                        <button
                            onClick={() => {
                                if (onHabitComplete) onHabitComplete(menuState.habitId);
                                closeMenu();
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-green-400 hover:bg-green-500/10 flex items-center gap-2"
                        >
                            <Check size={14} /> {language === 'ru' ? 'Выполнить' : 'Complete'}
                        </button>

                        {/* Stack With - Atomic Habits */}
                        <button
                            onClick={() => {
                                setStackingSource(menuState.habitId);
                                closeMenu();
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-purple-400 hover:bg-purple-500/10 flex items-center gap-2"
                        >
                            <Link2 size={14} /> {language === 'ru' ? 'Связать с...' : 'Stack with...'}
                        </button>

                        <div className="h-px bg-white/10 my-1" />

                        {/* View */}
                        <button
                            onClick={() => {
                                const h = habits.find(h => h.id === menuState.habitId);
                                if (h && onHabitClick) onHabitClick(h);
                                closeMenu();
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                        >
                            <Eye size={14} /> {language === 'ru' ? 'Открыть' : 'View'}
                        </button>

                        {/* Edit */}
                        <button
                            onClick={() => {
                                const h = habits.find(h => h.id === menuState.habitId);
                                if (h && onHabitEdit) onHabitEdit(h);
                                closeMenu();
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                        >
                            <Edit3 size={14} /> {language === 'ru' ? 'Изменить' : 'Edit'}
                        </button>

                        <div className="h-px bg-white/10 my-1" />

                        {/* Delete */}
                        <button
                            onClick={() => {
                                if (onHabitDelete) onHabitDelete(menuState.habitId);
                                closeMenu();
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                        >
                            <Trash2 size={14} /> {language === 'ru' ? 'Удалить' : 'Delete'}
                        </button>
                    </div>
                </>
            )}

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
                <div className="mt-3 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-purple-400" />
                        <span className="font-bold text-xs text-white/80">AI {language === 'ru' ? 'Рекомендации' : 'Suggestions'}</span>
                    </div>
                    <div className="space-y-1.5">
                        {aiSuggestions.slice(0, 3).map((s, i) => {
                            const src = habits.find(h => h.id === s.sourceId);
                            const tgt = habits.find(h => h.id === s.targetId);
                            if (!src || !tgt) return null;
                            return (
                                <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                                    <span className="text-xs text-white/60 flex-1 truncate">{src.name} → {tgt.name}</span>
                                    <button onClick={() => applyAiSuggestion(s)} className="px-2 py-1 bg-green-500 text-white rounded text-xs">✓</button>
                                    <button onClick={() => setAiSuggestions(p => p.filter(x => x !== s))} className="px-2 py-1 bg-white/10 text-white/50 rounded text-xs">✕</button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Connection Editor */}
            {selectedConnection && (
                <div className="mt-3 bg-[#2a2a3e] border border-white/10 rounded-xl p-2.5 flex items-center gap-2 flex-wrap">
                    {(Object.keys(CONNECTION_TYPES) as Array<keyof typeof CONNECTION_TYPES>).map(type => (
                        <button
                            key={type}
                            onClick={() => changeConnectionType(type)}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${connections.find(c => c.id === selectedConnection)?.type === type ? 'ring-1 ring-white/30' : 'opacity-60'
                                }`}
                            style={{ backgroundColor: `${CONNECTION_TYPES[type].color}30`, color: CONNECTION_TYPES[type].color }}
                        >
                            {CONNECTION_TYPES[type].label[language]}
                        </button>
                    ))}
                    <button onClick={deleteConnection} className="ml-auto text-red-400 hover:text-red-300 flex items-center gap-1 text-xs">
                        <Unlink size={12} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default HabitGraph;
