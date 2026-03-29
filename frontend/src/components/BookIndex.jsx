import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const BookIndex = ({ selectedBook, bookIndex, setAppStage, startCourseTopic, courseProgress = {}, isFetching, cooldown }) => {
    let globalTopicCounter = 0;
    const currentGlobalIndex = courseProgress.currentGlobalIndex || 0;

    return (
        <div className="course-index-stage glass-card">
            <div className="course-header mb-6" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <button className="back-btn" onClick={() => setAppStage('course-structure')}>
                    <ArrowLeft size={18} />
                </button>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0 }}>📖 {selectedBook?.title}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {isFetching ? '⏳ Preparing your lesson...' : 'Choose a topic to begin tutoring'}
                    </p>
                </div>
                {isFetching && <Loader2 className="animate-spin text-primary" size={20} />}
            </div>
            <div className="chapters-list" style={{ opacity: isFetching ? 0.6 : 1, pointerEvents: isFetching ? 'none' : 'auto' }}>
                {bookIndex?.chapters?.map((ch, i) => (
                    <div key={i} className="chapter-item glass-card mb-4" style={{ padding: '1.25rem' }}>
                        <div className="chapter-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                            <span style={{ background: 'var(--primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{ch.chapter_number}</span>
                            <h4 style={{ margin: 0 }}>{ch.chapter_title}</h4>
                        </div>
                        <div className="topics-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                            {ch.topics?.map((t, ti) => {
                                const topicIndex = globalTopicCounter++;
                                const isUnlocked = topicIndex <= currentGlobalIndex;
                                const isCompleted = topicIndex < currentGlobalIndex;

                                return (
                                    <motion.button
                                        key={ti}
                                        disabled={!isUnlocked || isFetching || cooldown > 0}
                                        className={`topic-select-btn ${!isUnlocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''} ${isFetching ? 'loading' : ''}`}
                                        onClick={() => isUnlocked && startCourseTopic(ch, t, topicIndex)}
                                        whileHover={isUnlocked && !isFetching ? { scale: 1.02 } : {}}
                                        style={{ 
                                            background: isCompleted ? 'rgba(34, 197, 94, 0.1)' : isUnlocked ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)', 
                                            border: isUnlocked ? '1px solid var(--primary)' : '1px solid var(--border)', 
                                            padding: '0.75rem', 
                                            borderRadius: '8px', 
                                            color: isUnlocked ? 'var(--text-main)' : 'var(--text-muted)', 
                                            textAlign: 'left', 
                                            cursor: (isUnlocked && !isFetching) ? 'pointer' : 'not-allowed', 
                                            fontSize: '0.9rem',
                                            opacity: isUnlocked ? 1 : 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            width: '100%'
                                        }}
                                    >
                                        <span>{isCompleted ? '✅' : isUnlocked ? '🔹' : '🔒'}</span>
                                        {t}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* ⏳ LOADING OVERLAY */}
            {(isFetching || cooldown > 0) && (
                <div className="loading-overlay" style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    borderRadius: '1.25rem'
                }}>
                    <Loader2 className="animate-spin text-primary mb-4" size={48} />
                    <h4 style={{ margin: 0, color: 'white' }}>
                        {isFetching ? 'Preparing your Lesson...' : `Please wait ${cooldown}s...`}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        {isFetching ? 'Curating content just for you.' : 'AI is catching its breath.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default BookIndex;
