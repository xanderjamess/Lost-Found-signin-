import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Trash2, Reply, ShieldAlert } from 'lucide-react';
import { Comment, User } from '../types';

interface CommentSectionProps {
  itemId: string;
  comments: Comment[];
  currentUser: User | null;
  onPostComment: (content: string, parentId?: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onUpdateComment: (commentId: string, updates: Partial<Comment>) => Promise<void>;
}

export default function CommentSection({ 
  itemId, 
  comments, 
  currentUser, 
  onPostComment, 
  onDeleteComment,
  onUpdateComment
}: CommentSectionProps) {
  const [newComment, setNewComment] = React.useState('');
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [replyContent, setReplyContent] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setIsSubmitting(true);
    await onPostComment(newComment.trim());
    setNewComment('');
    setIsSubmitting(false);
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || !currentUser) return;

    setIsSubmitting(true);
    await onPostComment(replyContent.trim(), parentId);
    setReplyContent('');
    setReplyingTo(null);
    setIsSubmitting(false);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="mt-8 pt-8 border-t ring-border">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare size={20} className="text-primary" />
        <h3 className="text-lg font-sans font-bold text-slate-800">Community Discussion</h3>
        <span className="text-xs font-medium text-muted ml-auto">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </span>
      </div>

      {/* New Comment Input */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative group">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ask a question or provide details..."
              className="input-field pr-12 min-h-[100px] resize-none"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="absolute bottom-3 right-3 p-2 bg-primary text-primary-fg rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-6 bg-bg rounded-2xl border ring-border text-center mb-8">
          <p className="text-sm text-muted">Please login to join the discussion.</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <motion.div
                key={comment.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-muted font-bold border-2 border-primary-fg shadow-sm">
                    {comment.userName.charAt(0)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{comment.userName}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold  tracking-wider ${
                          comment.userRole === 'admin' ? 'bg-primary/10 text-primary' : 'bg-green-100 text-green-700'
                        }`}>
                          {comment.userRole === 'admin' ? 'Staff' : 'Student'}
                        </span>
                        {comment.isFlagged && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ShieldAlert size={10} />
                            FLAGGED
                          </span>
                        )}
                        {comment.isHidden && (
                          <span className="text-[9px] bg-slate-100 text-muted px-1.5 py-0.5 rounded">HIDDEN</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted">
                        {new Date(comment.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed mb-3 ${comment.isHidden ? 'text-muted italic' : 'text-muted'}`}>
                      {comment.isHidden && !isAdmin ? 'This comment has been hidden by a moderator.' : comment.content}
                    </p>

                    <div className="flex items-center gap-4">
                      {currentUser && !replyingTo && !comment.isHidden && (
                        <button 
                          onClick={() => setReplyingTo(comment.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-muted hover:text-primary transition-colors"
                        >
                          <Reply size={12} />
                          REPLY
                        </button>
                      )}
                      {currentUser && !isAdmin && currentUser.id !== comment.userId && !comment.isFlagged && (
                        <button 
                          onClick={() => onUpdateComment(comment.id, { isFlagged: true })}
                          className="flex items-center gap-1 text-[10px] font-bold text-muted hover:text-amber-500 transition-colors"
                        >
                          <ShieldAlert size={12} />
                          FLAG
                        </button>
                      )}
                      {(isAdmin || currentUser?.id === comment.userId) && (
                        <>
                          {isAdmin && (
                            <button 
                              onClick={() => onUpdateComment(comment.id, { isHidden: !comment.isHidden })}
                              className="flex items-center gap-1 text-[10px] font-bold text-muted hover:text-primary transition-colors"
                            >
                              {comment.isHidden ? 'UNHIDE' : 'HIDE'}
                            </button>
                          )}
                          <button 
                            onClick={() => onDeleteComment(comment.id)}
                            className="flex items-center gap-1 text-[10px] font-bold text-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} />
                            {isAdmin ? 'MODERATE' : 'DELETE'}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Reply Form */}
                    <AnimatePresence>
                      {replyingTo === comment.id && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          onSubmit={(e) => handleReplySubmit(e, comment.id)}
                          className="mt-4"
                        >
                          <div className="relative">
                            <textarea
                              autoFocus
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder={`Reply to ${comment.userName}...`}
                              className="input-field py-2 min-h-[60px] text-xs"
                              disabled={isSubmitting}
                            />
                            <div className="mt-2 flex justify-end gap-2">
                              <button 
                                type="button" 
                                onClick={() => setReplyingTo(null)}
                                className="text-[10px] font-bold text-muted hover:text-muted px-2"
                              >
                                CANCEL
                              </button>
                              <button 
                                type="submit"
                                disabled={isSubmitting || !replyContent.trim()}
                                className="bg-primary text-primary-fg text-[10px] font-bold px-3 py-1 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                              >
                                SEND
                              </button>
                            </div>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-slate-50 space-y-4">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-bg rounded-full flex items-center justify-center text-muted font-bold text-xs border ring-border">
                              {reply.userName.charAt(0)}
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-baseline justify-between mb-0.5">
                                <span className="text-xs font-bold text-slate-800">{reply.userName}</span>
                                <span className="text-[9px] text-muted">{new Date(reply.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-xs text-muted">{reply.content}</p>
                              {(isAdmin || currentUser?.id === reply.userId) && (
                                <button 
                                  onClick={() => onDeleteComment(reply.id)}
                                  className="text-[9px] font-bold text-muted hover:text-red-500 mt-1"
                                >
                                  DELETE
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 px-4 bg-bg/50 rounded-3xl border border-dashed ring-border">
              <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-muted mx-auto mb-4 border ring-border">
                <MessageSquare size={24} />
              </div>
              <h4 className="text-sm font-bold text-muted mb-1">No comments yet</h4>
              <p className="text-xs text-muted">Be the first to share helpful information about this item.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
