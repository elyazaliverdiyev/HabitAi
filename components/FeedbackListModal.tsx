
import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { supabase } from '../supabaseClient';
import { translations } from '../translations';
import { Bug, Lightbulb, Heart, MessageSquare, Star, Mail, Calendar, CheckCircle2, Reply } from 'lucide-react';
import { AnimatedList } from './AnimatedList';

interface FeedbackListModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'ru' | 'en';
}

const FeedbackListModal: React.FC<FeedbackListModalProps> = ({ isOpen, onClose, language = 'ru' }) => {
  const t = translations[language].feedback;
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadFeedback();
    }
  }, [isOpen]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        id: item.id,
        userEmail: item.user_email,
        type: item.type,
        message: item.message,
        rating: item.rating,
        createdAt: item.created_at,
        isHandled: item.is_handled
      }));

      setFeedbacks(formattedData);
    } catch (e) {
      console.error("Failed to load feedback", e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDone = async (id: string, currentStatus: boolean) => {
      try {
          const { error } = await supabase
              .from('feedback')
              .update({ is_handled: !currentStatus })
              .eq('id', id);
              
          if (error) throw error;
          
          setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, isHandled: !currentStatus } : f));
      } catch (e) {
          console.error("Error updating status", e);
          alert("Error updating status. Check permissions.");
      }
  };

  const handleReply = (email: string, topic: string) => {
      if (!email || email === 'anonymous') {
          alert(language === 'ru' ? "Email не указан" : "No email provided");
          return;
      }
      const subject = language === 'ru' ? `Ответ на ваш отзыв: ${topic}` : `Reply to your feedback: ${topic}`;
      const body = language === 'ru' ? `Здравствуйте! Спасибо за ваш отзыв.\n\n` : `Hello! Thank you for your feedback.\n\n`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'bug': return <Bug size={16} className="text-red-500" />;
          case 'idea': return <Lightbulb size={16} className="text-amber-500" />;
          case 'thanks': return <Heart size={16} className="text-pink-500" />;
          default: return <MessageSquare size={16} className="text-blue-500" />;
      }
  };

  const getTypeLabel = (type: string) => {
      switch(type) {
          case 'bug': return t.types.bug;
          case 'idea': return t.types.idea;
          case 'thanks': return t.types.thanks;
          default: return t.types.other;
      }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.adminTitle}>
      <AnimatedList className="space-y-3 pb-4">
        {loading ? (
            <div className="py-8 text-center text-textSecondary animate-pulse">Loading...</div>
        ) : feedbacks.length === 0 ? (
            <div className="py-8 text-center text-textSecondary">{t.empty}</div>
        ) : (
            feedbacks.map((item) => (
                <div 
                    key={item.id} 
                    className={`border p-3 rounded-xl transition-all ${item.isHandled ? 'bg-surface border-borderSubtle opacity-60' : 'bg-surfaceHighlight/30 border-brand/30'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-surface rounded-lg shadow-sm">
                                {getIcon(item.type)}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-textPrimary flex items-center gap-2">
                                    {getTypeLabel(item.type)}
                                    {item.isHandled && <CheckCircle2 size={12} className="text-green-500" />}
                                </div>
                                <div className="flex items-center gap-1">
                                    {[1,2,3,4,5].map(s => (
                                        <Star key={s} size={8} className={s <= item.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="text-[10px] text-textSecondary font-medium flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    
                    <p className="text-sm text-textPrimary bg-surface p-2 rounded-lg border border-borderSubtle mb-2 whitespace-pre-wrap select-text">
                        {item.message || "(No text)"}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-[10px] text-textSecondary">
                            <Mail size={10} />
                            <span className="truncate max-w-[120px] select-all" title={item.userEmail}>{item.userEmail}</span>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleReply(item.userEmail, getTypeLabel(item.type))}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 rounded text-[10px] font-bold hover:bg-blue-500/20 transition-colors"
                            >
                                <Reply size={12} /> {language === 'ru' ? 'Ответить' : 'Reply'}
                            </button>
                            <button 
                                onClick={() => handleMarkAsDone(item.id, item.isHandled)}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-colors ${item.isHandled ? 'bg-surface text-textSecondary' : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'}`}
                            >
                                <CheckCircle2 size={12} /> {item.isHandled ? (language === 'ru' ? 'Вернуть' : 'Undo') : (language === 'ru' ? 'Готово' : 'Done')}
                            </button>
                        </div>
                    </div>
                </div>
            ))
        )}
      </AnimatedList>
    </Modal>
  );
};

export default FeedbackListModal;
