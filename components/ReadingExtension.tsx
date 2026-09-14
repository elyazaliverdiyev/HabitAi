
import React, { useState } from 'react';
import { Habit, Book } from '../types';
import { Book as BookIcon, Plus, CheckCircle2, Bookmark, MoreHorizontal, Trash2, Library, BookOpen, Edit2, Sparkles, RotateCcw, X, Check, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useToast } from './Toast';
import { AnimatedList } from './AnimatedList';
import { searchBooks } from '../services/ai';
import { generateId } from '../utils/helpers';

interface ReadingExtensionProps {
    habit: Habit;
    onUpdate: (habitId: string, updates: Partial<Habit>) => void;
    language?: 'ru' | 'en';
}

const ReadingExtension: React.FC<ReadingExtensionProps> = ({ habit, onUpdate, language = 'ru' }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'active' | 'inbox' | 'done'>('active');

    // Modes
    const [isAddMode, setIsAddMode] = useState(false);
    const [editingBookId, setEditingBookId] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [pages, setPages] = useState(300);

    // AI Search State
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Array<{ title: string, author: string, totalPages: number }>>([]);

    // Notes expansion state
    const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

    const books = habit.extension?.data?.books || [];
    const activeBooks = books.filter(b => b.status === 'reading');
    const inboxBooks = books.filter(b => b.status === 'inbox');
    const doneBooks = books.filter(b => b.status === 'finished');

    const handleSaveBook = () => {
        if (!title.trim()) return;

        let newBooks = [...books];

        if (editingBookId) {
            // Edit Mode
            newBooks = newBooks.map(b => b.id === editingBookId ? { ...b, title, author, totalPages: pages, updatedAt: new Date().toISOString() } : b);
        } else {
            // Add Mode
            // Limit Check for Active
            if (activeBooks.length >= 3 && activeTab === 'active') {
                toast.warning(language === 'ru' ? "Лимит 3 активные книги. Закончите одну, чтобы начать новую." : "Active limit reached (3). Finish a book first.");
                return;
            }

            const newBook: Book = {
                id: generateId(),
                title,
                author,
                currentPage: 0,
                totalPages: pages,
                status: activeTab === 'active' ? 'reading' : (activeTab === 'done' ? 'finished' : 'inbox'),
                updatedAt: new Date().toISOString()
            };
            newBooks.push(newBook);
        }

        onUpdate(habit.id, {
            extension: {
                type: 'reading',
                data: { ...habit.extension?.data, books: newBooks }
            }
        });

        resetForm();
    };

    const startEdit = (book: Book) => {
        setEditingBookId(book.id);
        setTitle(book.title);
        setAuthor(book.author);
        setPages(book.totalPages);
        setIsAddMode(true);
    };

    const resetForm = () => {
        setIsAddMode(false);
        setEditingBookId(null);
        setTitle('');
        setAuthor('');
        setPages(300);
        setSearchResults([]);
    };

    const handleUpdateBook = (bookId: string, updates: Partial<Book>) => {
        const newBooks = books.map(b => b.id === bookId ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b);
        onUpdate(habit.id, {
            extension: {
                type: 'reading',
                data: { ...habit.extension?.data, books: newBooks }
            }
        });
    };

    const handleDeleteBook = (bookId: string) => {
        if (!confirm(language === 'ru' ? "Удалить книгу?" : "Delete book?")) return;
        const newBooks = books.filter(b => b.id !== bookId);
        onUpdate(habit.id, {
            extension: {
                type: 'reading',
                data: { ...habit.extension?.data, books: newBooks }
            }
        });
    };

    const handleAiSearch = async () => {
        if (!title.trim()) return;
        setIsSearching(true);
        const results = await searchBooks(title, language as 'ru' | 'en');
        setSearchResults(results);
        setIsSearching(false);
    };

    const applySearchResult = (res: { title: string, author: string, totalPages: number }) => {
        setTitle(res.title);
        setAuthor(res.author);
        setPages(res.totalPages);
        setSearchResults([]); // Close suggestions
    };

    const renderBookCard = (book: Book) => {
        const progress = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));

        // Simple color based cover generation if no URL
        const hash = book.title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const hue = hash % 360;

        return (
            <div key={book.id} className="bg-surfaceHighlight/30 border border-borderSubtle rounded-xl p-3 flex gap-3 relative group">
                {/* Cover */}
                <div
                    className="w-16 h-24 rounded-lg shadow-sm flex items-center justify-center text-center p-1 shrink-0 overflow-hidden relative cursor-pointer"
                    style={{ backgroundColor: `hsl(${hue}, 60%, 80%)`, color: `hsl(${hue}, 80%, 20%)` }}
                    onClick={() => startEdit(book)}
                >
                    {book.coverUrl ? (
                        <img src={book.coverUrl} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <BookIcon size={16} className="mb-1 opacity-50" />
                            <span className="text-[8px] font-bold leading-tight line-clamp-3">{book.title}</span>
                        </div>
                    )}
                    {/* Spine effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/10"></div>

                    {/* Edit Overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Edit2 size={16} className="text-white drop-shadow-md" />
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm text-textPrimary leading-tight line-clamp-1 cursor-pointer hover:text-brand transition-colors" onClick={() => startEdit(book)}>{book.title}</h4>
                            <button onClick={() => startEdit(book)} className="text-textSecondary hover:text-textPrimary p-0.5 -mt-1"><MoreHorizontal size={14} /></button>
                        </div>
                        <p className="text-[10px] text-textSecondary truncate">{book.author || (language === 'ru' ? 'Автор неизвестен' : 'Unknown Author')}</p>
                    </div>

                    {book.status !== 'inbox' && (
                        <div className="space-y-1.5 mt-1">
                            <div className="flex justify-between text-[9px] font-bold text-textSecondary uppercase">
                                <span>{progress}%</span>
                                <span className="text-textPrimary bg-surfaceHighlight px-1.5 py-0.5 rounded font-mono">
                                    {book.currentPage} / {book.totalPages} {language === 'ru' ? 'стр' : 'p'}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-surfaceHighlight rounded-full overflow-hidden">
                                <div className="h-full bg-brand transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
                            </div>

                            {/* Quick Page Adders and Subtractors */}
                            {book.status === 'reading' && (
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    <input
                                        type="number"
                                        min="0" max={book.totalPages}
                                        value={book.currentPage || ''}
                                        onChange={(e) => {
                                            const val = Math.min(book.totalPages, Math.max(0, parseInt(e.target.value) || 0));
                                            handleUpdateBook(book.id, { currentPage: val });
                                        }}
                                        className="w-14 bg-surface border border-borderSubtle rounded-lg px-1.5 py-1 text-xs font-bold text-center outline-none focus:border-brand"
                                    />
                                    <button
                                        onClick={() => handleUpdateBook(book.id, { currentPage: Math.max(0, book.currentPage - 10) })}
                                        disabled={book.currentPage <= 0}
                                        className="px-2 py-1 bg-surfaceHighlight hover:bg-red-500/10 hover:text-red-500 border border-borderSubtle rounded-lg text-textSecondary disabled:opacity-30 font-bold text-[11px] transition-colors"
                                    >
                                        -10
                                    </button>
                                    <button
                                        onClick={() => handleUpdateBook(book.id, { currentPage: Math.max(0, book.currentPage - 5) })}
                                        disabled={book.currentPage <= 0}
                                        className="px-2 py-1 bg-surfaceHighlight hover:bg-red-500/10 hover:text-red-500 border border-borderSubtle rounded-lg text-textSecondary disabled:opacity-30 font-bold text-[11px] transition-colors"
                                    >
                                        -5
                                    </button>
                                    <button
                                        onClick={() => handleUpdateBook(book.id, { currentPage: Math.min(book.totalPages, book.currentPage + 5) })}
                                        className="px-2 py-1 bg-surfaceHighlight hover:bg-brand/10 hover:text-brand border border-borderSubtle rounded-lg text-textPrimary font-bold text-[11px] transition-colors"
                                    >
                                        +5
                                    </button>
                                    <button
                                        onClick={() => handleUpdateBook(book.id, { currentPage: Math.min(book.totalPages, book.currentPage + 10) })}
                                        className="px-2 py-1 bg-surfaceHighlight hover:bg-brand/10 hover:text-brand border border-borderSubtle rounded-lg text-textPrimary font-bold text-[11px] transition-colors"
                                    >
                                        +10
                                    </button>
                                    <button
                                        onClick={() => handleUpdateBook(book.id, { currentPage: Math.min(book.totalPages, book.currentPage + 25) })}
                                        className="px-2 py-1 bg-surfaceHighlight hover:bg-brand/10 hover:text-brand border border-borderSubtle rounded-lg text-textPrimary font-bold text-[11px] transition-colors"
                                    >
                                        +25
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions Row: Moving between Shelves */}
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-borderSubtle/50 flex-wrap">
                        {book.status === 'inbox' && (
                            <>
                                <button
                                    onClick={() => handleUpdateBook(book.id, { status: 'reading' })}
                                    className="text-[10px] bg-brand text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 hover:opacity-90 transition-opacity"
                                >
                                    <BookOpen size={11} /> {language === 'ru' ? 'Читать' : 'Read'}
                                </button>
                                <button
                                    onClick={() => handleUpdateBook(book.id, { status: 'finished', currentPage: book.totalPages })}
                                    className="text-[10px] bg-surfaceHighlight text-textSecondary hover:text-emerald-500 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                                >
                                    <CheckCircle2 size={11} /> {language === 'ru' ? 'Прочитано' : 'Finished'}
                                </button>
                            </>
                        )}

                        {book.status === 'reading' && (
                            <>
                                <button
                                    onClick={() => handleUpdateBook(book.id, { status: 'inbox' })}
                                    className="text-[10px] bg-surfaceHighlight text-textSecondary hover:text-textPrimary px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                                >
                                    <Library size={11} /> {language === 'ru' ? 'На полку' : 'To Shelf'}
                                </button>
                                <button
                                    onClick={() => handleUpdateBook(book.id, { status: 'finished', currentPage: book.totalPages })}
                                    className="text-[10px] bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                                >
                                    <CheckCircle2 size={11} /> {language === 'ru' ? 'Завершить' : 'Finish'}
                                </button>
                            </>
                        )}

                        {book.status === 'finished' && (
                            <>
                                <button
                                    onClick={() => handleUpdateBook(book.id, { status: 'reading', currentPage: 0 })}
                                    className="text-[10px] bg-surfaceHighlight text-textSecondary hover:text-brand px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                                >
                                    <RotateCcw size={11} /> {language === 'ru' ? 'Читать снова' : 'Re-read'}
                                </button>
                                <button
                                    onClick={() => handleUpdateBook(book.id, { status: 'inbox' })}
                                    className="text-[10px] bg-surfaceHighlight text-textSecondary hover:text-textPrimary px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                                >
                                    <Library size={11} /> {language === 'ru' ? 'На полку' : 'To Shelf'}
                                </button>
                            </>
                        )}

                        <div className="flex-1" />
                        <button
                            onClick={() => handleDeleteBook(book.id)}
                            className="text-textSecondary hover:text-red-500 transition-colors p-1"
                            title={language === 'ru' ? 'Удалить книгу' : 'Delete book'}
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>

                    {/* Notes Section */}
                    <div className="mt-2 pt-2 border-t border-borderSubtle">
                        <button
                            onClick={() => setExpandedNotesId(expandedNotesId === book.id ? null : book.id)}
                            className="flex items-center gap-1.5 text-[10px] text-textSecondary hover:text-brand transition-colors w-full"
                        >
                            <FileText size={12} />
                            <span>{language === 'ru' ? 'Заметки' : 'Notes'}</span>
                            {book.notes && <span className="text-brand">•</span>}
                            {expandedNotesId === book.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {expandedNotesId === book.id && (
                            <textarea
                                value={book.notes || ''}
                                onChange={(e) => handleUpdateBook(book.id, { notes: e.target.value })}
                                placeholder={language === 'ru' ? 'Важные цитаты, идеи, выводы...' : 'Key quotes, ideas, takeaways...'}
                                className="w-full mt-2 p-2 bg-surface border border-borderSubtle rounded-lg text-xs text-textPrimary placeholder-textSecondary/50 resize-none focus:border-brand outline-none"
                                rows={4}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${activeTab === 'active' ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary'}`}
                    >
                        <BookOpen size={12} />
                        {language === 'ru' ? 'Читаю' : 'Reading'} <span className="opacity-60 text-[9px]">{activeBooks.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${activeTab === 'inbox' ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary'}`}
                    >
                        <Library size={12} />
                        {language === 'ru' ? 'Полка' : 'Inbox'}
                    </button>
                    <button
                        onClick={() => setActiveTab('done')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${activeTab === 'done' ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary'}`}
                    >
                        <CheckCircle2 size={12} />
                        {language === 'ru' ? 'Финиш' : 'Done'}
                    </button>
                </div>
            </div>

            {/* Add/Edit Book Form */}
            {isAddMode ? (
                <div className="bg-surfaceHighlight/20 p-3 rounded-xl border border-borderSubtle mb-4 animate-slideUp">
                    <div className="text-xs font-bold text-textSecondary uppercase mb-2">
                        {editingBookId ? (language === 'ru' ? 'Редактирование' : 'Editing') : (language === 'ru' ? 'Новая книга' : 'New Book')}
                    </div>

                    <div className="flex gap-2 mb-2">
                        <div className="relative flex-1">
                            <input
                                className="w-full bg-surface p-2 pr-8 rounded-lg text-sm border border-borderSubtle focus:border-brand outline-none"
                                placeholder={language === 'ru' ? "Название книги" : "Book Title"}
                                value={title} onChange={e => setTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
                                autoFocus
                            />
                            <button
                                onClick={handleAiSearch}
                                disabled={isSearching || !title}
                                className="gemini-glow-sm bg-surface absolute right-1 top-1 p-1.5 text-brand hover:bg-brand/10 rounded-md transition-colors disabled:opacity-30"
                                title="AI Autocomplete"
                            >
                                {isSearching ? <RotateCcw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="mb-2 space-y-1">
                            {searchResults.map((res, i) => (
                                <button
                                    key={i}
                                    onClick={() => applySearchResult(res)}
                                    className="w-full text-left p-2 bg-surface border border-borderSubtle rounded-lg hover:bg-brand/5 flex items-center justify-between group"
                                >
                                    <div>
                                        <div className="text-xs font-bold text-textPrimary">{res.title}</div>
                                        <div className="text-[10px] text-textSecondary">{res.author}, {res.totalPages}p</div>
                                    </div>
                                    <Plus size={14} className="text-brand opacity-0 group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 mb-2">
                        <input
                            className="flex-1 bg-surface p-2 rounded-lg text-xs border border-borderSubtle outline-none"
                            placeholder={language === 'ru' ? "Автор" : "Author"}
                            value={author} onChange={e => setAuthor(e.target.value)}
                        />
                        <input
                            className="w-20 bg-surface p-2 rounded-lg text-xs border border-borderSubtle outline-none text-center"
                            type="number"
                            placeholder="Pages"
                            value={pages || ''} onChange={e => setPages(Math.max(1, parseInt(e.target.value) || 0))}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSaveBook} className="flex-1 bg-brand text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                            <Check size={14} /> {language === 'ru' ? "Сохранить" : "Save"}
                        </button>
                        <button onClick={resetForm} className="bg-surfaceHighlight px-3 rounded-lg text-xs font-bold text-textPrimary flex items-center justify-center gap-1">
                            <X size={14} /> {language === 'ru' ? "Отмена" : "Cancel"}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAddMode(true)}
                    className="w-full py-2.5 border border-dashed border-borderSubtle rounded-xl text-xs font-bold text-textSecondary hover:border-brand/50 hover:text-brand transition-colors mb-4 flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> {language === 'ru' ? "Добавить книгу" : "Add Book"}
                </button>
            )}

            <AnimatedList className="space-y-3">
                {activeTab === 'active' && activeBooks.map(renderBookCard)}
                {activeTab === 'inbox' && inboxBooks.map(renderBookCard)}
                {activeTab === 'done' && doneBooks.map(renderBookCard)}

                {((activeTab === 'active' && activeBooks.length === 0) ||
                    (activeTab === 'inbox' && inboxBooks.length === 0) ||
                    (activeTab === 'done' && doneBooks.length === 0)) && !isAddMode && (
                        <div className="text-center py-8 text-textSecondary text-xs italic opacity-60">
                            {language === 'ru' ? "Здесь пока пусто" : "Empty here"}
                        </div>
                    )}
            </AnimatedList>
        </div>
    );
};

export default ReadingExtension;
