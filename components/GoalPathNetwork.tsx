import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Habit, HabitConnection, Goal, CONNECTION_TYPES, getCurrentStreak, Book, Supplement, SUPPLEMENT_TIMING } from '../types';
import {
    Link2, Trash2, X, Plus, Minus, RotateCcw, Flame, Check, Settings, Maximize2,
    BookOpen, Minimize2, StickyNote, Grid3X3, Circle, GitBranch, Unlink, Layers, Edit3, Move
} from 'lucide-react';

interface GoalPathNetworkProps {
    habits: Habit[];
    goals: Goal[];
    connections: HabitConnection[];
    onConnectionsChange: (connections: HabitConnection[]) => void;
    nodePositions: Record<string, { x: number; y: number }>;
    onNodePositionsChange: (positions: Record<string, { x: number; y: number }>) => void;
    onHabitClick?: (habit: Habit) => void;
    onGoalClick?: (goal: Goal) => void;
    language: 'ru' | 'en';
}

interface PathNode {
    id: string;
    type: 'habit' | 'goal' | 'book' | 'note' | 'task' | 'supplement';
    name: string;
    icon: string;
    x: number;
    y: number;
    completed?: boolean;
    streak?: number;
    progress?: number;
    parentId?: string;
    bookData?: Book;
    color?: string;
    noteText?: string;
}

interface GraphNote { id: string; text: string; x: number; y: number; color: string; }

type LayoutMode = 'free' | 'radial' | 'tree' | 'grid' | 'flow' | 'spiral';

const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const generateId = () => Math.random().toString(36).substr(2, 9);
const isEmoji = (str: string): boolean => str ? /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(str) : false;
const getDisplayIcon = (icon: string, fallback: string): string => isEmoji(icon) ? icon : fallback;

const NOTE_COLORS = ['#fbbf24', '#f472b6', '#60a5fa', '#34d399', '#a78bfa', '#f87171'];

const LAYOUT_MODES: { id: LayoutMode; label: { ru: string; en: string } }[] = [
    { id: 'free', label: { ru: '🆓 Свободно', en: '🆓 Free' } },
    { id: 'radial', label: { ru: '⭕ Радиальный', en: '⭕ Radial' } },
    { id: 'tree', label: { ru: '🌳 Дерево', en: '🌳 Tree' } },
    { id: 'grid', label: { ru: '📐 Сетка', en: '📐 Grid' } },
    { id: 'flow', label: { ru: '〰️ Поток', en: '〰️ Flow' } },
    { id: 'spiral', label: { ru: '🌀 Спираль', en: '🌀 Spiral' } },
];

const GoalPathNetwork: React.FC<GoalPathNetworkProps> = ({
    habits, goals, connections, onConnectionsChange,
    nodePositions, onNodePositionsChange,
    onHabitClick, onGoalClick, language
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 700 });
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [isLinkMode, setIsLinkMode] = useState(false);
    const [zoom, setZoom] = useState(0.65);
    const [pan, setPan] = useState({ x: 50, y: 20 });
    const [isExpanded, setIsExpanded] = useState(false);
    const [notes, setNotes] = useState<GraphNote[]>([]);
    const [editingNote, setEditingNote] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState<'none' | 'add' | 'layout'>('none');
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('free');
    const [animating, setAnimating] = useState(false);

    // Spacebar panning state
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

    // Touch gestures for mobile
    const [isMobile, setIsMobile] = useState(false);
    const [touchStart, setTouchStart] = useState<{ x: number, y: number, dist: number } | null>(null);
    const lastTouchRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

    const todayStr = getLocalDateString();

    // Measure container
    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width || 800, height: rect.height || 700 });
            }
        };
        setTimeout(update, 50);
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [isExpanded]);

    // Detect mobile & set responsive zoom
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768 || 'ontouchstart' in window;
            setIsMobile(mobile);
            if (mobile) {
                setZoom(0.5); // Smaller zoom for mobile
                setPan({ x: 20, y: 10 });
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Spacebar panning - keyboard listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && !editingNote) {
                e.preventDefault();
                setIsPanning(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsPanning(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [editingNote]);

    // Apply layout with animation
    const applyLayout = (mode: LayoutMode) => {
        setShowMenu('none');
        setLayoutMode(mode);

        if (mode === 'free') return;

        setAnimating(true);
        setTimeout(() => setAnimating(false), 500);

        const newPos: Record<string, { x: number; y: number }> = {};
        const w = isExpanded ? window.innerWidth - 40 : dimensions.width;
        const h = isExpanded ? window.innerHeight - 40 : dimensions.height;
        const centerX = w / 2;
        const centerY = h / 2;
        const activeGoals = goals.filter(g => !g.archived && !g.completedAt);
        const allHabits = habits;
        const nodeSize = 130;
        const minSpacing = nodeSize * 1.6;

        if (mode === 'radial') {
            activeGoals.forEach((g, i) => {
                const angle = activeGoals.length === 1 ? 0 : (i / activeGoals.length) * Math.PI * 2 - Math.PI / 2;
                const r = activeGoals.length === 1 ? 0 : 140;
                newPos[`goal-${g.id}`] = { x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r - 100 };
            });
            const radius = Math.max(320, allHabits.length * 30);
            allHabits.forEach((h, i) => {
                const angle = (i / allHabits.length) * Math.PI * 2 - Math.PI / 2;
                newPos[h.id] = { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius * 0.75 };
            });
        } else if (mode === 'tree') {
            const goalSpacing = Math.max(220, w / (activeGoals.length + 1));
            activeGoals.forEach((g, i) => {
                newPos[`goal-${g.id}`] = { x: goalSpacing * (i + 1), y: 140 };
            });
            const cols = Math.min(allHabits.length, Math.max(3, Math.floor(w / minSpacing)));
            const rowSpacing = Math.max(200, h / (Math.ceil(allHabits.length / cols) + 2));
            allHabits.forEach((h, i) => {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const rowItems = Math.min(cols, allHabits.length - row * cols);
                const colSpacing = w / (rowItems + 1);
                newPos[h.id] = { x: colSpacing * (col + 1), y: 380 + row * rowSpacing };
            });
        } else if (mode === 'grid') {
            const all = [...activeGoals.map(g => `goal-${g.id}`), ...allHabits.map(h => h.id)];
            const cols = Math.ceil(Math.sqrt(all.length));
            const cellW = Math.max(minSpacing, (w - 120) / cols);
            const cellH = Math.max(minSpacing + 20, (h - 120) / Math.ceil(all.length / cols));
            all.forEach((id, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                newPos[id] = { x: 80 + col * cellW + cellW / 2, y: 100 + row * cellH + cellH / 2 };
            });
        } else if (mode === 'flow') {
            const all = [...activeGoals.map(g => `goal-${g.id}`), ...allHabits.map(h => h.id)];
            const verticalSpacing = Math.max(120, (h - 220) / all.length);
            all.forEach((id, i) => {
                const progress = i / Math.max(all.length - 1, 1);
                const wave = Math.sin(progress * Math.PI * 2.5) * Math.min(220, w / 3.5);
                newPos[id] = { x: centerX + wave, y: 120 + i * verticalSpacing };
            });
        } else if (mode === 'spiral') {
            activeGoals.forEach((g, i) => {
                newPos[`goal-${g.id}`] = { x: centerX, y: centerY - 60 };
            });
            allHabits.forEach((h, i) => {
                const angle = i * 0.75;
                const radius = 180 + i * 40;
                newPos[h.id] = { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius * 0.65 };
            });
        }

        // Position books with MORE spacing - horizontal layout
        habits.forEach(habit => {
            if (habit.extension?.type === 'reading' && habit.extension.data.books) {
                const parentPos = newPos[habit.id] || nodePositions[habit.id];
                if (parentPos) {
                    const books = habit.extension.data.books;
                    const bookSpacing = 130; // Horizontal spacing between books
                    const totalWidth = (books.length - 1) * bookSpacing;
                    const startX = parentPos.x - totalWidth / 2;

                    books.forEach((book, bi) => {
                        newPos[`book-${book.id}`] = {
                            x: startX + bi * bookSpacing,
                            y: parentPos.y + 130 // Below parent
                        };
                    });
                }
            }
        });

        // Keep notes
        notes.forEach(note => {
            newPos[`note-${note.id}`] = nodePositions[`note-${note.id}`] || { x: note.x, y: note.y };
        });

        onNodePositionsChange(newPos);
    };

    // Build nodes from data
    const nodes: PathNode[] = useMemo(() => {
        const result: PathNode[] = [];
        const activeGoals = goals.filter(g => !g.archived && !g.completedAt);
        const w = dimensions.width;

        activeGoals.forEach((g, i) => {
            const savedPos = nodePositions[`goal-${g.id}`];
            const spacing = w / (activeGoals.length + 1);
            const linkedHabits = habits.filter(h => g.linkedHabitIds?.includes(h.id));
            const completedToday = linkedHabits.filter(h => h.completedDates?.includes(todayStr)).length;
            const progress = linkedHabits.length > 0 ? Math.round((completedToday / linkedHabits.length) * 100) : 0;

            result.push({
                id: `goal-${g.id}`, type: 'goal', name: g.title,
                icon: getDisplayIcon(g.emoji, '🎯'),
                x: savedPos?.x ?? spacing * (i + 1), y: savedPos?.y ?? 100,
                progress, color: g.color || '#f59e0b',
            });
        });

        habits.forEach((h, i) => {
            const savedPos = nodePositions[h.id];
            const cols = Math.min(habits.length, 5);
            const spacing = (w - 80) / Math.max(cols, 1);
            result.push({
                id: h.id, type: h.type === 'task' ? 'task' : 'habit', name: h.name,
                icon: getDisplayIcon(h.icon || '', h.type === 'task' ? '✓' : '⚡'),
                x: savedPos?.x ?? 40 + (i % cols) * spacing + spacing / 2,
                y: savedPos?.y ?? 280 + Math.floor(i / cols) * 170,
                completed: h.completedDates?.includes(todayStr),
                streak: getCurrentStreak(h), color: h.color,
            });

            // Books - horizontal layout with more spacing
            if (h.extension?.type === 'reading' && h.extension.data.books) {
                const parentPos = savedPos || { x: 40 + (i % cols) * spacing + spacing / 2, y: 280 + Math.floor(i / cols) * 170 };
                const books = h.extension.data.books;
                const bookSpacing = 130;
                const totalWidth = (books.length - 1) * bookSpacing;
                const startX = parentPos.x - totalWidth / 2;

                books.forEach((book, bi) => {
                    const bookSavedPos = nodePositions[`book-${book.id}`];
                    result.push({
                        id: `book-${book.id}`, type: 'book', name: book.title, icon: '📖',
                        x: bookSavedPos?.x ?? startX + bi * bookSpacing,
                        y: bookSavedPos?.y ?? parentPos.y + 130,
                        parentId: h.id, bookData: book,
                        progress: book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0,
                    });
                });
            }

            // Supplements - horizontal layout like books
            if (h.extension?.type === 'supplements' && h.extension.data.supplements) {
                const parentPos = savedPos || { x: 40 + (i % cols) * spacing + spacing / 2, y: 280 + Math.floor(i / cols) * 170 };
                const supplements = h.extension.data.supplements;
                const suppSpacing = 100;
                const totalWidth = (supplements.length - 1) * suppSpacing;
                const startX = parentPos.x - totalWidth / 2;

                supplements.forEach((supp, si) => {
                    const suppSavedPos = nodePositions[`supp-${supp.id}`];
                    const timingInfo = SUPPLEMENT_TIMING[supp.timing];
                    const isTaken = supp.takenDates?.includes(todayStr);
                    result.push({
                        id: `supp-${supp.id}`, type: 'supplement' as any, name: supp.name,
                        icon: timingInfo?.emoji || '💊',
                        x: suppSavedPos?.x ?? startX + si * suppSpacing,
                        y: suppSavedPos?.y ?? parentPos.y + 120,
                        parentId: h.id,
                        completed: isTaken,
                        color: supp.color || '#8b5cf6',
                    });
                });
            }
        });

        notes.forEach(note => {
            const savedPos = nodePositions[`note-${note.id}`];
            result.push({
                id: `note-${note.id}`, type: 'note', name: note.text, icon: '📝',
                x: savedPos?.x ?? note.x, y: savedPos?.y ?? note.y,
                color: note.color, noteText: note.text,
            });
        });

        return result;
    }, [habits, goals, nodePositions, dimensions.width, todayStr, notes]);

    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        if (isPanning) return; // Don't drag nodes while panning

        if (isLinkMode) {
            setConnectingFrom(nodeId);
        } else {
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
                setDraggingNode(nodeId);
                setDragOffset({
                    x: e.clientX / zoom - node.x - pan.x / zoom,
                    y: e.clientY / zoom - node.y - pan.y / zoom
                });
            }
        }
    };

    const handleContainerMouseDown = (e: React.MouseEvent) => {
        if (isPanning) {
            e.preventDefault();
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            setPanOffset(pan);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Spacebar panning
        if (isPanning && e.buttons === 1) {
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
            return;
        }

        // Node dragging
        if (draggingNode) {
            const newX = e.clientX / zoom - dragOffset.x - pan.x / zoom;
            const newY = e.clientY / zoom - dragOffset.y - pan.y / zoom;

            const updates: Record<string, { x: number; y: number }> = {
                [draggingNode]: { x: newX, y: newY }
            };

            // Move books with parent
            const habit = habits.find(h => h.id === draggingNode);
            if (habit?.extension?.type === 'reading' && habit.extension.data.books) {
                const oldPos = nodePositions[draggingNode] || nodes.find(n => n.id === draggingNode) || { x: 0, y: 0 };
                const dx = newX - oldPos.x;
                const dy = newY - oldPos.y;
                habit.extension.data.books.forEach(book => {
                    const bookPos = nodePositions[`book-${book.id}`] || nodes.find(n => n.id === `book-${book.id}`);
                    if (bookPos) {
                        updates[`book-${book.id}`] = { x: bookPos.x + dx, y: bookPos.y + dy };
                    }
                });
            }

            onNodePositionsChange({ ...nodePositions, ...updates });
        }

        // Link preview
        if (connectingFrom) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (connectingFrom) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const x = (e.clientX - rect.left - pan.x) / zoom;
                const y = (e.clientY - rect.top - pan.y) / zoom;
                const target = nodes.find(n => n.id !== connectingFrom && n.type !== 'book' && n.type !== 'note' && Math.hypot(n.x - x, n.y - y) < 80);
                if (target) {
                    const srcId = connectingFrom.replace('goal-', '');
                    const tgtId = target.id.replace('goal-', '');
                    if (!connections.some(c => (c.sourceId === srcId && c.targetId === tgtId) || (c.sourceId === tgtId && c.targetId === srcId))) {
                        onConnectionsChange([...connections, { id: generateId(), sourceId: srcId, targetId: tgtId, type: 'triggers', strength: 2 }]);
                    }
                }
            }
            setConnectingFrom(null);
        }
        setDraggingNode(null);
    };

    // Touch handlers for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            // Single finger - pan
            const touch = e.touches[0];
            setTouchStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y, dist: 0 });
            lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
        } else if (e.touches.length === 2) {
            // Two fingers - pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            setTouchStart({ x: pan.x, y: pan.y, dist });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // Node dragging with touch
        if (draggingNode && e.touches.length === 1) {
            const touch = e.touches[0];
            const newX = touch.clientX / zoom - dragOffset.x - pan.x / zoom;
            const newY = touch.clientY / zoom - dragOffset.y - pan.y / zoom;

            const updates: Record<string, { x: number; y: number }> = {
                [draggingNode]: { x: newX, y: newY }
            };

            // Move books with parent
            const habit = habits.find(h => h.id === draggingNode);
            if (habit?.extension?.type === 'reading' && habit.extension.data.books) {
                const oldPos = nodePositions[draggingNode] || nodes.find(n => n.id === draggingNode) || { x: 0, y: 0 };
                const dx = newX - oldPos.x;
                const dy = newY - oldPos.y;
                habit.extension.data.books.forEach(book => {
                    const bookPos = nodePositions[`book-${book.id}`] || nodes.find(n => n.id === `book-${book.id}`);
                    if (bookPos) {
                        updates[`book-${book.id}`] = { x: bookPos.x + dx, y: bookPos.y + dy };
                    }
                });
            }

            onNodePositionsChange({ ...nodePositions, ...updates });
            return;
        }

        if (!touchStart) return;

        if (e.touches.length === 1 && !draggingNode) {
            // Single finger pan
            const touch = e.touches[0];
            setPan({ x: touch.clientX - touchStart.x, y: touch.clientY - touchStart.y });
        } else if (e.touches.length === 2 && touchStart.dist > 0) {
            // Pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const scale = dist / touchStart.dist;
            setZoom(z => Math.max(0.3, Math.min(2, z * scale)));
            setTouchStart({ ...touchStart, dist });
        }
    };

    const handleTouchEnd = () => {
        setTouchStart(null);
        setDraggingNode(null);
    };

    // Force repulsion to prevent overlap (runs after layout or on demand)
    const applyForceRepulsion = useCallback(() => {
        const minDist = isMobile ? 140 : 220; // Increased minimum distance between nodes
        const iterations = 80;
        const strength = 0.5;

        const positions = { ...nodePositions };
        const nodeIds = nodes.filter(n => n.type !== 'book').map(n => n.id);

        for (let iter = 0; iter < iterations; iter++) {
            for (let i = 0; i < nodeIds.length; i++) {
                for (let j = i + 1; j < nodeIds.length; j++) {
                    const id1 = nodeIds[i];
                    const id2 = nodeIds[j];
                    const p1 = positions[id1] || nodes.find(n => n.id === id1);
                    const p2 = positions[id2] || nodes.find(n => n.id === id2);

                    if (!p1 || !p2) continue;

                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.max(Math.hypot(dx, dy), 1);

                    if (dist < minDist) {
                        const force = ((minDist - dist) / dist) * strength;
                        const fx = dx * force;
                        const fy = dy * force;

                        positions[id1] = { x: p1.x - fx, y: p1.y - fy };
                        positions[id2] = { x: p2.x + fx, y: p2.y + fy };
                    }
                }
            }
        }

        return positions;
    }, [nodePositions, nodes, isMobile]);

    // Auto-apply force repulsion after layout mode changes to prevent overlap
    const prevLayoutModeRef = useRef<LayoutMode>(layoutMode);
    useEffect(() => {
        if (layoutMode !== 'free' && prevLayoutModeRef.current !== layoutMode) {
            // Delay to let layout animation complete, then apply force
            const timer = setTimeout(() => {
                const newPositions = applyForceRepulsion();
                if (newPositions && Object.keys(newPositions).length > 0) {
                    onNodePositionsChange(newPositions);
                }
            }, 650); // After layout animation (500ms) + buffer
            prevLayoutModeRef.current = layoutMode;
            return () => clearTimeout(timer);
        }
        prevLayoutModeRef.current = layoutMode;
    }, [layoutMode, applyForceRepulsion, onNodePositionsChange]);

    // Note functions
    const addNote = () => {
        const newNote: GraphNote = {
            id: generateId(),
            text: language === 'ru' ? 'Новая заметка' : 'New note',
            x: 200 + Math.random() * 200,
            y: 200 + Math.random() * 200,
            color: NOTE_COLORS[notes.length % NOTE_COLORS.length]
        };
        setNotes([...notes, newNote]);
        setShowMenu('none');
        setTimeout(() => setEditingNote(`note-${newNote.id}`), 100);
    };

    const updateNote = (id: string, text: string) => {
        setNotes(notes.map(n => n.id === id ? { ...n, text } : n));
    };

    const deleteNote = (id: string) => {
        setNotes(notes.filter(n => n.id !== id));
        setSelectedNode(null);
        setEditingNote(null);
    };

    const deleteConnection = (connId: string) => {
        onConnectionsChange(connections.filter(c => c.id !== connId));
        setSelectedConnection(null);
    };

    const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null;

    // Zoom with wheel
    useEffect(() => {
        const container = containerRef.current;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            setZoom(z => Math.max(0.25, Math.min(2.5, z + (e.deltaY > 0 ? -0.08 : 0.08))));
        };
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, []);

    // Toggle fullscreen
    const toggleFullscreen = () => {
        setIsExpanded(prev => !prev);
        setShowMenu('none');
    };

    // Close menus on click outside
    const handleBackgroundClick = () => {
        setShowMenu('none');
        if (!draggingNode && !isPanning) {
            setSelectedNode(null);
            setSelectedConnection(null);
        }
    };

    if (habits.length === 0 && goals.length === 0) {
        return (
            <div className={`flex items-center justify-center rounded-2xl ${isExpanded ? 'fixed inset-0 z-[9999] m-0' : 'h-[700px]'}`}
                style={{ background: 'linear-gradient(135deg, #1a1040 0%, #0c0a1a 100%)' }}>
                <div className="text-center">
                    <div className="text-6xl mb-4">🗺️</div>
                    <p className="text-xl text-white/80 font-bold">{language === 'ru' ? 'Создай привычки' : 'Create habits'}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden select-none ${isExpanded ? 'fixed inset-0 z-50 rounded-none' : 'h-[700px] rounded-2xl'}`}
            style={{
                background: 'radial-gradient(ellipse at 50% 30%, #2d1b69 0%, #1a0f3c 35%, #0d0618 70%, #050208 100%)',
                cursor: isPanning ? 'grab' : 'default',
                touchAction: 'none'
            }}
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleBackgroundClick}
            tabIndex={0}
        >
            {/* CSS Animations */}
            <style>{`
                .glass { background: rgba(255,255,255,0.06); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); }
                .glass-strong { background: rgba(255,255,255,0.1); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.12); }
                .node-animate { transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1), top 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
                
                /* Crystal goal floating */
                @keyframes crystal-float { 
                    0%, 100% { transform: translateY(0) rotateY(0deg); } 
                    50% { transform: translateY(-10px) rotateY(5deg); } 
                }
                .crystal-float { animation: crystal-float 6s ease-in-out infinite; }
                
                /* Crystal glow pulse */
                @keyframes crystal-glow {
                    0%, 100% { filter: drop-shadow(0 0 20px rgba(251,191,36,0.4)) drop-shadow(0 0 40px rgba(249,115,22,0.2)); }
                    50% { filter: drop-shadow(0 0 35px rgba(251,191,36,0.7)) drop-shadow(0 0 60px rgba(249,115,22,0.4)); }
                }
                .crystal-glow { animation: crystal-glow 3s ease-in-out infinite; }
                
                /* Planet shimmer - soft light wave */
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .planet-shimmer::after {
                    content: '';
                    position: absolute;
                    inset: -2px;
                    border-radius: 50%;
                    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 60%, transparent 100%);
                    background-size: 200% 100%;
                    animation: shimmer 4s ease-in-out infinite;
                    pointer-events: none;
                }
                
                /* Orbital rings */
                @keyframes orbit-spin { 0% { transform: rotateX(70deg) rotateZ(0deg); } 100% { transform: rotateX(70deg) rotateZ(360deg); } }
                .orbit-ring { animation: orbit-spin 20s linear infinite; }
                .orbit-ring-slow { animation: orbit-spin 35s linear infinite reverse; }
                
                /* Completed glow */
                @keyframes completed-pulse {
                    0%, 100% { box-shadow: 0 0 15px rgba(34,197,94,0.4), inset 0 0 20px rgba(34,197,94,0.1); }
                    50% { box-shadow: 0 0 30px rgba(34,197,94,0.7), inset 0 0 30px rgba(34,197,94,0.2); }
                }
                .completed-planet { animation: completed-pulse 2.5s ease-in-out infinite; }
                
                /* Star twinkle */
                @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
            `}</style>

            {/* Static star field */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Large stars - few and bright */}
                {[...Array(15)].map((_, i) => (
                    <div key={`star-l-${i}`} className="absolute rounded-full"
                        style={{
                            left: `${(i * 37 + 13) % 100}%`,
                            top: `${(i * 29 + 7) % 100}%`,
                            width: 2,
                            height: 2,
                            background: 'white',
                            opacity: 0.6,
                            animation: `twinkle ${3 + (i % 3)}s ease-in-out infinite`,
                            animationDelay: `${i * 0.3}s`
                        }} />
                ))}
                {/* Small stars - many and dim */}
                {[...Array(60)].map((_, i) => (
                    <div key={`star-s-${i}`} className="absolute rounded-full bg-white/20"
                        style={{
                            left: `${(i * 17 + 5) % 100}%`,
                            top: `${(i * 23 + 11) % 100}%`,
                            width: 1,
                            height: 1,
                        }} />
                ))}
                {/* Nebula clouds */}
                <div className="absolute w-[600px] h-[400px] rounded-full opacity-20"
                    style={{
                        left: '20%', top: '30%',
                        background: 'radial-gradient(ellipse, rgba(139,92,246,0.3) 0%, transparent 70%)',
                        filter: 'blur(60px)'
                    }} />
                <div className="absolute w-[400px] h-[300px] rounded-full opacity-15"
                    style={{
                        right: '10%', bottom: '20%',
                        background: 'radial-gradient(ellipse, rgba(236,72,153,0.3) 0%, transparent 70%)',
                        filter: 'blur(50px)'
                    }} />
            </div>

            {/* SVG Layer */}
            <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
                <defs>
                    <linearGradient id="connectionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                        <stop offset="50%" stopColor="#4ade80" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
                    </linearGradient>
                    <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    {/* Book connections */}
                    {nodes.filter(n => n.type === 'book' && n.parentId).map(book => {
                        const parent = nodes.find(n => n.id === book.parentId);
                        if (!parent) return null;
                        return <line key={`bc-${book.id}`} x1={parent.x} y1={parent.y} x2={book.x} y2={book.y} stroke="rgba(139,92,246,0.35)" strokeWidth="2" strokeDasharray="6 4" />;
                    })}

                    {/* Main connections */}
                    {connections.map(conn => {
                        const source = nodes.find(n => n.id === conn.sourceId || n.id === `goal-${conn.sourceId}`);
                        const target = nodes.find(n => n.id === conn.targetId || n.id === `goal-${conn.targetId}`);
                        if (!source || !target) return null;
                        const isSelected = selectedConnection === conn.id;
                        const dx = target.x - source.x;
                        const dy = target.y - source.y;
                        const midX = source.x + dx / 2;
                        const midY = source.y + dy / 2 - Math.abs(dx) * 0.15;
                        const path = `M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`;
                        return (
                            <g key={conn.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setSelectedConnection(conn.id); setSelectedNode(null); }}>
                                <path
                                    d={path}
                                    fill="none"
                                    stroke={isSelected ? '#4ade80' : 'url(#connectionGrad)'}
                                    strokeWidth={isSelected ? 5 : 2.5}
                                    filter={isSelected ? 'url(#glow)' : 'none'}
                                    strokeDasharray={isSelected ? "10, 5" : "none"}
                                    style={{
                                        animation: isSelected ? 'flowEnergy 10s linear infinite' : 'none',
                                        strokeOpacity: isSelected ? 1 : 0.4
                                    }}
                                />
                                <circle r="4" fill="#4ade80" filter="url(#glow)" style={{ display: isSelected ? 'block' : 'none' }}>
                                    <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
                                </circle>

                                <style>{`
                                    @keyframes flowEnergy {
                                        from { stroke-dashoffset: 200; }
                                        to { stroke-dashoffset: 0; }
                                    }
                                `}</style>
                            </g>
                        );
                    })}

                    {/* Connection preview */}
                    {connectingFrom && (
                        <line
                            x1={nodes.find(n => n.id === connectingFrom)?.x || 0}
                            y1={nodes.find(n => n.id === connectingFrom)?.y || 0}
                            x2={(mousePos.x - pan.x) / zoom}
                            y2={(mousePos.y - pan.y) / zoom}
                            stroke="#4ade80" strokeWidth="3" strokeDasharray="8 4" strokeLinecap="round"
                        />
                    )}
                </g>
            </svg>

            {/* Nodes Layer */}
            <div className="absolute inset-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>

                {/* Notes */}
                {nodes.filter(n => n.type === 'note').map(node => (
                    <div
                        key={node.id}
                        className={`absolute ${animating ? 'node-animate' : ''} ${selectedNode === node.id ? 'z-20' : 'z-10'}`}
                        style={{ left: node.x - 70, top: node.y - 50, cursor: isPanning ? 'grab' : 'grab' }}
                        onMouseDown={(e) => { if (!editingNote && !isPanning) handleMouseDown(e, node.id); }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`w-[140px] min-h-[100px] rounded-xl p-3 shadow-xl transition-transform ${selectedNode === node.id ? 'ring-2 ring-white/50 scale-105' : ''}`}
                            style={{ background: node.color || '#fbbf24', color: '#1a1a1a' }}>
                            {editingNote === node.id ? (
                                <textarea
                                    autoFocus
                                    defaultValue={node.noteText}
                                    className="w-full min-h-[70px] bg-transparent text-sm resize-none outline-none font-medium"
                                    onBlur={(e) => { updateNote(node.id.replace('note-', ''), e.target.value); setEditingNote(null); }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <div
                                    className="text-sm font-medium min-h-[70px] cursor-text"
                                    onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); }}
                                    onDoubleClick={(e) => { e.stopPropagation(); setEditingNote(node.id); }}
                                >
                                    {node.noteText || '...'}
                                </div>
                            )}
                            <button
                                className="absolute top-1 right-1 p-1 rounded bg-black/20 text-black/60 hover:bg-black/30"
                                onClick={(e) => { e.stopPropagation(); setEditingNote(node.id); }}
                            >
                                <Edit3 size={12} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Books */}
                {nodes.filter(n => n.type === 'book').map(node => (
                    <div
                        key={node.id}
                        className={`absolute ${animating ? 'node-animate' : ''}`}
                        style={{ left: node.x - 55, top: node.y - 40, cursor: isPanning ? 'grab' : 'grab' }}
                        onMouseDown={(e) => !isPanning && handleMouseDown(e, node.id)}
                        onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); }}
                    >
                        <div className={`w-[110px] rounded-xl p-2.5 glass ${selectedNode === node.id ? 'ring-2 ring-purple-400/60 scale-105' : ''}`}>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📖</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] text-white/90 font-semibold truncate">{node.name}</div>
                                    {node.bookData && <div className="text-[9px] text-white/50">{node.bookData.currentPage}/{node.bookData.totalPages}</div>}
                                </div>
                            </div>
                            {node.progress !== undefined && node.progress > 0 && (
                                <div className="mt-2 h-1.5 bg-purple-900/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full" style={{ width: `${node.progress}%` }} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Habits & Tasks - Planet Spheres */}
                {nodes.filter(n => n.type === 'habit' || n.type === 'task').map(node => {
                    const size = isMobile ? 75 : 100;
                    const offset = size / 2;
                    // Generate planet color based on node color or default gradient
                    const planetColors = [
                        ['#3b82f6', '#1d4ed8', '#1e3a8a'], // Blue
                        ['#22c55e', '#16a34a', '#14532d'], // Green
                        ['#8b5cf6', '#7c3aed', '#4c1d95'], // Purple
                        ['#f59e0b', '#d97706', '#78350f'], // Amber
                        ['#06b6d4', '#0891b2', '#164e63'], // Cyan
                        ['#ec4899', '#db2777', '#831843'], // Pink
                    ];
                    const colorIndex = node.id.charCodeAt(0) % planetColors.length;
                    const colors = planetColors[colorIndex];

                    return (
                        <div
                            key={node.id}
                            className={`absolute ${animating ? 'node-animate' : ''}`}
                            style={{ left: node.x - offset, top: node.y - offset, cursor: isPanning ? 'grab' : 'grab' }}
                            onMouseDown={(e) => !isPanning && handleMouseDown(e, node.id)}
                            onTouchStart={(e) => {
                                if (!isPanning && e.touches.length === 1) {
                                    const touch = e.touches[0];
                                    setDraggingNode(node.id);
                                    setDragOffset({ x: touch.clientX / zoom - node.x - pan.x / zoom, y: touch.clientY / zoom - node.y - pan.y / zoom });
                                }
                            }}
                            onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); }}
                        >
                            {/* Planet sphere */}
                            <div
                                className={`relative planet-shimmer rounded-full flex flex-col items-center justify-center transition-all ${node.completed ? 'completed-planet' : ''
                                    } ${selectedNode === node.id ? 'ring-2 ring-white/40 scale-110' : 'hover:scale-105'}`}
                                style={{
                                    width: size,
                                    height: size,
                                    background: `radial-gradient(circle at 30% 30%, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`,
                                    boxShadow: `inset -8px -8px 20px rgba(0,0,0,0.4), inset 4px 4px 15px rgba(255,255,255,0.15), 0 0 30px ${colors[0]}40`
                                }}
                            >
                                {/* Highlight reflection */}
                                <div className="absolute rounded-full bg-white/30"
                                    style={{ width: size * 0.3, height: size * 0.2, left: size * 0.2, top: size * 0.15, filter: 'blur(3px)' }} />

                                <span className={isMobile ? 'text-2xl' : 'text-3xl'} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{node.icon}</span>
                                <span className={`text-white font-bold truncate text-center px-2 drop-shadow-lg ${isMobile ? 'text-[7px] max-w-[60px]' : 'text-[9px] max-w-[80px]'}`}>{node.name}</span>

                                {node.streak !== undefined && node.streak > 0 && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                                        <Flame size={isMobile ? 8 : 10} className="text-orange-400" />
                                        <span className={`${isMobile ? 'text-[6px]' : 'text-[8px]'} text-orange-400 font-bold`}>{node.streak}</span>
                                    </div>
                                )}

                                {node.completed && (
                                    <div className={`absolute -top-1 -right-1 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'} bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50`}>
                                        <Check size={isMobile ? 12 : 14} className="text-white" strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Goals - Glowing Crystals with Orbits */}
                {nodes.filter(n => n.type === 'goal').map(node => {
                    const scale = isMobile ? 0.65 : 1;
                    const crystalW = 80 * scale;
                    const crystalH = 100 * scale;
                    const containerSize = 160 * scale;

                    return (
                        <div
                            key={node.id}
                            className={`absolute ${animating ? 'node-animate' : ''}`}
                            style={{ left: node.x - containerSize / 2, top: node.y - containerSize / 2, cursor: isPanning ? 'grab' : 'grab' }}
                            onMouseDown={(e) => !isPanning && handleMouseDown(e, node.id)}
                            onTouchStart={(e) => {
                                if (!isPanning && e.touches.length === 1) {
                                    const touch = e.touches[0];
                                    setDraggingNode(node.id);
                                    setDragOffset({ x: touch.clientX / zoom - node.x - pan.x / zoom, y: touch.clientY / zoom - node.y - pan.y / zoom });
                                }
                            }}
                            onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); }}
                        >
                            <div className={`relative flex items-center justify-center transition-transform ${selectedNode === node.id ? 'scale-110' : 'hover:scale-105'}`}
                                style={{ width: containerSize, height: containerSize }}>

                                {/* Orbital rings */}
                                <div className="absolute orbit-ring rounded-full border border-amber-500/25"
                                    style={{ width: containerSize * 0.9, height: containerSize * 0.3, transformStyle: 'preserve-3d' }} />
                                <div className="absolute orbit-ring-slow rounded-full border border-orange-400/20"
                                    style={{ width: containerSize * 0.75, height: containerSize * 0.25, transformStyle: 'preserve-3d' }} />

                                {/* Crystal with glow */}
                                <div className="crystal-float crystal-glow relative" style={{ width: crystalW, height: crystalH }}>
                                    <svg viewBox="0 0 80 100" className="w-full h-full">
                                        <defs>
                                            <linearGradient id={`crystal-${node.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#fcd34d" />
                                                <stop offset="30%" stopColor="#fbbf24" />
                                                <stop offset="60%" stopColor="#f97316" />
                                                <stop offset="100%" stopColor="#ea580c" />
                                            </linearGradient>
                                            <linearGradient id={`crystal-dark-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#b45309" />
                                                <stop offset="100%" stopColor="#78350f" />
                                            </linearGradient>
                                        </defs>
                                        {/* Top facet */}
                                        <polygon points="40,0 80,50 40,60 0,50" fill={`url(#crystal-${node.id})`} />
                                        {/* Bottom facet - darker */}
                                        <polygon points="40,60 80,50 40,100 0,50" fill={`url(#crystal-dark-${node.id})`} />
                                        {/* Left shadow facet */}
                                        <polygon points="0,50 40,60 40,100" fill="rgba(0,0,0,0.3)" />
                                        {/* Highlight */}
                                        <polygon points="40,5 55,35 40,40 25,35" fill="rgba(255,255,255,0.3)" />
                                    </svg>

                                    {/* Icon overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: crystalH * 0.15 }}>
                                        <span className={isMobile ? 'text-lg' : 'text-2xl'} style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}>{node.icon}</span>
                                    </div>
                                </div>

                                {/* Progress badge */}
                                {node.progress !== undefined && node.progress > 0 && (
                                    <div className={`absolute bg-gradient-to-r from-amber-400 to-orange-500 rounded-full font-bold text-white shadow-lg shadow-orange-500/30 ${isMobile ? 'px-1.5 py-0.5 text-[8px] top-0 right-2' : 'px-2 py-1 text-[10px] top-1 right-4'}`}>
                                        {node.progress}%
                                    </div>
                                )}
                            </div>

                            {/* Goal name */}
                            <div className={`text-amber-200/90 font-bold text-center truncate -mt-2 drop-shadow-lg ${isMobile ? 'text-[9px] w-[100px] mx-auto' : 'text-[11px] w-[140px] mx-auto'}`}>
                                {node.name}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pan mode indicator */}
            {isPanning && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-xl text-white/80 px-4 py-2 rounded-xl text-sm font-bold pointer-events-none z-50 flex items-center gap-2">
                    <Move size={18} /> {language === 'ru' ? 'Перемещение' : 'Panning'}
                </div>
            )}

            {/* Top Controls */}
            <div className="absolute top-3 right-3 flex gap-2 z-50" onClick={(e) => e.stopPropagation()}>
                <button className="p-2.5 rounded-xl glass text-white/70 hover:text-white hover:bg-white/10 transition-all" onClick={() => setShowMenu(showMenu === 'add' ? 'none' : 'add')}>
                    <Plus size={18} />
                </button>
                <button className="p-2.5 rounded-xl glass text-white/70 hover:text-white hover:bg-white/10 transition-all" onClick={() => setShowMenu(showMenu === 'layout' ? 'none' : 'layout')}>
                    <Grid3X3 size={18} />
                </button>
                <button className="p-2.5 rounded-xl glass text-white/70 hover:text-white hover:bg-white/10 transition-all" onClick={toggleFullscreen}>
                    {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${isLinkMode ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30' : 'glass text-white/70 hover:text-white'}`} onClick={() => setIsLinkMode(!isLinkMode)}>
                    <Link2 size={16} />{language === 'ru' ? 'Связь' : 'Link'}
                </button>
            </div>

            {/* Add Menu */}
            {showMenu === 'add' && (
                <div className="absolute top-16 right-3 glass-strong rounded-xl p-2 z-50 min-w-[150px] shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/90 hover:bg-white/10 w-full text-left transition-all" onClick={addNote}>
                        <StickyNote size={18} className="text-amber-400" />{language === 'ru' ? 'Заметка' : 'Note'}
                    </button>
                </div>
            )}

            {/* Layout Menu */}
            {showMenu === 'layout' && (
                <div className="absolute top-16 right-14 glass-strong rounded-xl p-2 z-50 min-w-[160px] shadow-xl" onClick={(e) => e.stopPropagation()}>
                    {LAYOUT_MODES.map(mode => (
                        <button
                            key={mode.id}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-all ${layoutMode === mode.id ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                            onClick={() => applyLayout(mode.id)}
                        >
                            {mode.label[language]}
                        </button>
                    ))}
                    <div className="border-t border-white/10 my-2" />
                    <button
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm w-full text-left text-cyan-400 hover:bg-cyan-500/20 transition-all"
                        onClick={() => {
                            const newPositions = applyForceRepulsion();
                            onNodePositionsChange(newPositions);
                            setShowMenu('none');
                        }}
                    >
                        ✨ {language === 'ru' ? 'Расставить' : 'Auto Spread'}
                    </button>
                </div>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-3 right-3 flex gap-1.5 z-50" onClick={(e) => e.stopPropagation()}>
                <button className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white/60 hover:text-white transition-all" onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}><Plus size={18} /></button>
                <button className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white/60 hover:text-white transition-all" onClick={() => setZoom(z => Math.max(0.25, z - 0.15))}><Minus size={18} /></button>
                <button className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white/60 hover:text-white transition-all" onClick={() => { setZoom(0.65); setPan({ x: 50, y: 20 }); }}><RotateCcw size={18} /></button>
            </div>

            {/* Zoom indicator + Hint */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-50">
                <div className="px-3 py-2 glass rounded-xl text-xs text-white/60 font-mono">{Math.round(zoom * 100)}%</div>
                {!isMobile && (
                    <div className="px-3 py-1.5 glass rounded-lg text-[10px] text-white/40">
                        {language === 'ru' ? '🖱 Колёсико = Zoom • Пробел + Drag = Pan' : '🖱 Scroll = Zoom • Space + Drag = Pan'}
                    </div>
                )}
                {isMobile && (
                    <div className="px-3 py-1.5 glass rounded-lg text-[10px] text-white/40">
                        {language === 'ru' ? '👆 Drag = Pan • 🤏 Pinch = Zoom' : '👆 Drag = Pan • 🤏 Pinch = Zoom'}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="absolute top-3 left-3 flex gap-1.5 z-50 flex-wrap max-w-[200px]">
                {[{ icon: '◆', color: '#f59e0b', label: language === 'ru' ? 'Цель' : 'Goal' },
                { icon: '■', color: '#6b7280', label: language === 'ru' ? 'Привычка' : 'Habit' },
                { icon: '●', color: '#a78bfa', label: language === 'ru' ? 'Книга' : 'Book' }].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 glass rounded-lg text-[9px] text-white/70">
                        <span style={{ color: item.color }}>{item.icon}</span>{item.label}
                    </div>
                ))}
            </div>

            {/* Selected Node Panel */}
            {selectedNodeData && (
                <div className="absolute bottom-16 left-3 right-3 glass-strong rounded-2xl p-4 z-50 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-4">
                        <span className="text-3xl">{selectedNodeData.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-lg truncate">{selectedNodeData.name}</div>
                            <div className="text-sm text-white/50">
                                {selectedNodeData.type === 'habit' && `${language === 'ru' ? 'Стрик' : 'Streak'}: ${selectedNodeData.streak || 0} 🔥`}
                                {selectedNodeData.type === 'goal' && `${language === 'ru' ? 'Прогресс' : 'Progress'}: ${selectedNodeData.progress || 0}%`}
                                {selectedNodeData.type === 'book' && selectedNodeData.bookData && `${selectedNodeData.bookData.currentPage}/${selectedNodeData.bookData.totalPages} стр.`}
                                {selectedNodeData.type === 'note' && (language === 'ru' ? 'Заметка' : 'Note')}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {selectedNodeData.type === 'habit' && (
                                <button className="p-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-all" onClick={() => { const h = habits.find(x => x.id === selectedNodeData.id); if (h) onHabitClick?.(h); }}>
                                    <Settings size={18} />
                                </button>
                            )}
                            {selectedNodeData.type === 'goal' && (
                                <button className="p-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-all" onClick={() => { const g = goals.find(x => `goal-${x.id}` === selectedNodeData.id); if (g) onGoalClick?.(g); }}>
                                    <Settings size={18} />
                                </button>
                            )}
                            {selectedNodeData.type === 'note' && (
                                <>
                                    <button className="p-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-all" onClick={() => setEditingNote(selectedNodeData.id)}>
                                        <Edit3 size={18} />
                                    </button>
                                    <button className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all" onClick={() => deleteNote(selectedNodeData.id.replace('note-', ''))}>
                                        <Trash2 size={18} />
                                    </button>
                                </>
                            )}
                            <button className="p-2.5 rounded-xl bg-white/10 text-white/50 hover:text-white transition-all" onClick={() => setSelectedNode(null)}>
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Connection Panel */}
            {selectedConnection && (
                <div className="absolute bottom-16 left-3 right-3 glass-strong rounded-2xl p-4 z-50 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Link2 size={20} className="text-green-400" />
                        </div>
                        <div className="flex-1">
                            <div className="text-white font-bold">{language === 'ru' ? 'Связь' : 'Connection'}</div>
                            <div className="text-sm text-white/50">{language === 'ru' ? 'Между двумя узлами' : 'Between two nodes'}</div>
                        </div>
                        <button className="px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center gap-2 text-sm font-bold transition-all" onClick={() => deleteConnection(selectedConnection)}>
                            <Unlink size={16} />{language === 'ru' ? 'Разорвать' : 'Unlink'}
                        </button>
                        <button className="p-2.5 rounded-xl bg-white/10 text-white/50 hover:text-white transition-all" onClick={() => setSelectedConnection(null)}>
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Link Mode Indicator */}
            {isLinkMode && !connectingFrom && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-bold z-50 shadow-xl shadow-green-500/30">
                    🔗 {language === 'ru' ? 'Зажми узел и перетащи' : 'Hold node and drag'}
                </div>
            )}
        </div>
    );
};

export default GoalPathNetwork;
