import React, { useEffect, useRef, useState, useCallback } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, Simulation, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import { select } from 'd3-selection';
import { drag } from 'd3-drag';
import { Habit, HabitConnection } from '../types';
import { Sparkles, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ObsidianGraphProps {
    habits: Habit[];
    connections: HabitConnection[];
    onHabitClick?: (habit: Habit) => void;
    language: 'ru' | 'en';
}

interface GraphNode extends SimulationNodeDatum {
    id: string;
    name: string;
    category: string;
    icon: string;
    color: string;
    radius: number;
    completedToday: boolean;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
    id: string;
    type: string;
}

const CATEGORY_COLORS: Record<string, string> = {
    'Здоровье': '#ef4444', 'Health': '#ef4444',
    'Спорт': '#f97316', 'Fitness': '#f97316',
    'Продуктивность': '#3b82f6', 'Productivity': '#3b82f6',
    'Обучение': '#8b5cf6', 'Learning': '#8b5cf6',
    'Финансы': '#22c55e', 'Finance': '#22c55e',
    'Осознанность': '#ec4899', 'Mindfulness': '#ec4899',
};

const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const ObsidianGraph: React.FC<ObsidianGraphProps> = ({
    habits,
    connections,
    onHabitClick,
    language
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const simulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

    const todayStr = getLocalDateString();

    // Build graph data - LARGER NODES
    const buildGraphData = useCallback(() => {
        const connectionCount: Record<string, number> = {};
        connections.forEach(c => {
            connectionCount[c.sourceId] = (connectionCount[c.sourceId] || 0) + 1;
            connectionCount[c.targetId] = (connectionCount[c.targetId] || 0) + 1;
        });

        const nodes: GraphNode[] = habits.map(h => ({
            id: h.id,
            name: h.name,
            category: h.category || 'Other',
            icon: h.icon || '⚡',
            color: CATEGORY_COLORS[h.category || ''] || '#6366f1',
            // Bigger base radius: 20-40px instead of 8-20px
            radius: Math.max(20, Math.min(40, 20 + (connectionCount[h.id] || 0) * 5)),
            completedToday: h.completedDates?.includes(todayStr) || false,
        }));

        const nodeIds = new Set(nodes.map(n => n.id));
        const links: GraphLink[] = connections
            .filter(c => nodeIds.has(c.sourceId) && nodeIds.has(c.targetId))
            .map(c => ({
                id: c.id,
                source: c.sourceId,
                target: c.targetId,
                type: c.type,
            }));

        return { nodes, links };
    }, [habits, connections, todayStr]);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || habits.length === 0) return;

        const svg = select(svgRef.current);
        const { width, height } = containerRef.current.getBoundingClientRect();
        const centerX = width / 2;
        const centerY = height / 2;

        svg.selectAll('*').remove();

        const { nodes, links } = buildGraphData();

        const g = svg.append('g').attr('class', 'main-group');

        // Create force simulation - adjusted for bigger nodes
        const simulation = forceSimulation<GraphNode>(nodes)
            .force('link', forceLink<GraphNode, GraphLink>(links)
                .id(d => d.id)
                .distance(120)
                .strength(0.3))
            .force('charge', forceManyBody().strength(-300))
            .force('center', forceCenter(centerX, centerY))
            .force('collision', forceCollide<GraphNode>().radius(d => d.radius + 15));

        simulationRef.current = simulation;

        // Draw links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll<SVGLineElement, GraphLink>('line')
            .data(links)
            .join('line')
            .attr('stroke', '#ffffff')
            .attr('stroke-opacity', 0.25)
            .attr('stroke-width', 2);

        // Draw glow circles
        const glowCircle = g.append('g')
            .attr('class', 'glows')
            .selectAll<SVGCircleElement, GraphNode>('circle')
            .data(nodes)
            .join('circle')
            .attr('r', (d: GraphNode) => d.radius * 1.8)
            .attr('fill', (d: GraphNode) => d.color)
            .attr('opacity', 0.15)
            .style('filter', 'blur(10px)');

        // Draw node circles - BIGGER and more visible
        const nodeGroup = g.append('g')
            .attr('class', 'nodes')
            .selectAll<SVGGElement, GraphNode>('g')
            .data(nodes)
            .join('g')
            .style('cursor', 'pointer');

        // Node circle
        nodeGroup.append('circle')
            .attr('r', (d: GraphNode) => d.radius)
            .attr('fill', (d: GraphNode) => d.color)
            .attr('stroke', (d: GraphNode) => d.completedToday ? '#ffffff' : d.color)
            .attr('stroke-width', (d: GraphNode) => d.completedToday ? 3 : 1)
            .attr('opacity', 0.9)
            .style('filter', (d: GraphNode) => d.completedToday ? `drop-shadow(0 0 12px ${d.color})` : `drop-shadow(0 0 6px ${d.color})`);

        // Node icon/emoji
        nodeGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', (d: GraphNode) => d.radius * 0.7)
            .attr('fill', '#ffffff')
            .text((d: GraphNode) => d.icon.match(/\p{Emoji}/u) ? d.icon : '⚡');

        // Node label below
        nodeGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', (d: GraphNode) => d.radius + 14)
            .attr('font-size', '10px')
            .attr('font-weight', '600')
            .attr('fill', '#ffffff')
            .attr('opacity', 0.8)
            .text((d: GraphNode) => d.name.length > 12 ? d.name.slice(0, 10) + '...' : d.name);

        // Drag behavior with touch support
        const dragBehavior = drag<SVGGElement, GraphNode>()
            .on('start', function (event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
                select(this).raise();
            })
            .on('drag', function (event, d) {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', function (event, d) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });

        nodeGroup.call(dragBehavior);

        // Click and hover events
        nodeGroup
            .on('mouseenter touchstart', function (event, d: GraphNode) {
                event.preventDefault();
                setHoveredNode(d);
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
                    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
                    setTooltipPos({
                        x: clientX - rect.left,
                        y: clientY - rect.top - 60
                    });
                }
                select(this).select('circle')
                    .transition()
                    .duration(200)
                    .attr('r', d.radius * 1.15);
            })
            .on('mouseleave touchend', function (event, d: GraphNode) {
                setHoveredNode(null);
                select(this).select('circle')
                    .transition()
                    .duration(200)
                    .attr('r', d.radius);
            })
            .on('click', function (event, d: GraphNode) {
                event.stopPropagation();
                const habit = habits.find(h => h.id === d.id);
                if (habit && onHabitClick) onHabitClick(habit);
            });

        // Simulation tick
        simulation.on('tick', () => {
            link
                .attr('x1', (d: GraphLink) => (d.source as GraphNode).x || 0)
                .attr('y1', (d: GraphLink) => (d.source as GraphNode).y || 0)
                .attr('x2', (d: GraphLink) => (d.target as GraphNode).x || 0)
                .attr('y2', (d: GraphLink) => (d.target as GraphNode).y || 0);

            glowCircle
                .attr('cx', (d: GraphNode) => d.x || 0)
                .attr('cy', (d: GraphNode) => d.y || 0);

            nodeGroup
                .attr('transform', (d: GraphNode) => `translate(${d.x || 0}, ${d.y || 0})`);
        });

        return () => {
            simulation.stop();
        };
    }, [habits, connections, buildGraphData, onHabitClick]);

    // Apply transform
    useEffect(() => {
        if (svgRef.current) {
            const g = select(svgRef.current).select('.main-group');
            g.attr('transform', `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`);
        }
    }, [transform]);

    const handleZoom = (delta: number) => {
        setTransform(t => ({ ...t, scale: Math.max(0.3, Math.min(2, t.scale + delta)) }));
    };

    const handleReset = () => {
        setTransform({ x: 0, y: 0, scale: 1 });
        if (simulationRef.current) {
            simulationRef.current.alpha(0.8).restart();
        }
    };

    if (habits.length === 0) {
        return (
            <div className="h-[450px] flex items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(180deg, #0d1117, #161b22)' }}>
                <div className="text-center text-white/50">
                    <Sparkles size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm">{language === 'ru' ? 'Нет привычек' : 'No habits'}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative h-[450px] rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0d1117, #161b22)' }}
        >
            {/* Stars */}
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `radial-gradient(1px 1px at 20px 30px, white, transparent),
                                  radial-gradient(1px 1px at 40px 70px, white, transparent),
                                  radial-gradient(1.5px 1.5px at 120px 100px, white, transparent),
                                  radial-gradient(1px 1px at 90px 180px, white, transparent),
                                  radial-gradient(1px 1px at 200px 50px, white, transparent)`,
                backgroundSize: '250px 250px'
            }} />

            <svg
                ref={svgRef}
                className="w-full h-full"
                style={{ touchAction: 'none' }}
            />

            {/* Tooltip */}
            {hoveredNode && (
                <div
                    className="absolute pointer-events-none px-3 py-2 bg-black/90 backdrop-blur-md rounded-xl border border-white/20 z-20 shadow-xl"
                    style={{
                        left: Math.max(10, Math.min(tooltipPos.x - 60, (containerRef.current?.offsetWidth || 300) - 140)),
                        top: Math.max(10, tooltipPos.y),
                    }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{hoveredNode.icon}</span>
                        <span className="text-white text-sm font-bold">{hoveredNode.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: hoveredNode.color }}
                        />
                        <span className="text-white/60 text-xs">{hoveredNode.category}</span>
                    </div>
                    {hoveredNode.completedToday && (
                        <span className="text-green-400 text-xs font-semibold">✓ {language === 'ru' ? 'Выполнено сегодня' : 'Completed today'}</span>
                    )}
                </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
                <button
                    onClick={() => handleZoom(0.2)}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-all active:scale-95"
                >
                    <ZoomIn size={18} />
                </button>
                <button
                    onClick={() => handleZoom(-0.2)}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-all active:scale-95"
                >
                    <ZoomOut size={18} />
                </button>
                <button
                    onClick={handleReset}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-all active:scale-95"
                >
                    <RotateCcw size={18} />
                </button>
            </div>

            {/* Legend */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[220px] z-10">
                {Object.entries(CATEGORY_COLORS).slice(0, 6).filter((_, i) => i % 2 === 0).map(([cat, color]) => (
                    <div
                        key={cat}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] bg-black/50 backdrop-blur-sm border border-white/10"
                    >
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                        <span className="text-white/80 font-medium">{cat}</span>
                    </div>
                ))}
            </div>

            {/* Hint */}
            <div className="absolute bottom-3 left-3 text-white/40 text-[10px] z-10">
                {language === 'ru' ? 'Перетаскивайте узлы' : 'Drag nodes to move'}
            </div>
        </div>
    );
};

export default ObsidianGraph;
