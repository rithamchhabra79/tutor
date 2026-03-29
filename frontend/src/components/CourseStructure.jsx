import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CourseStructure = ({ topic, courseData, setAppStage, handleBookSelect, isFetching, cooldown, currentGlobalIndex = 0 }) => {
    // 🔒 SEMESTER LOCKING LOGIC
    // Each book is estimated to have ~20 topics (AI standard for this app)
    // Semester 1 is always unlocked.
    // Semester 2 unlocks if all topics in Semester 1 books are completed.
    
    let totalTopicsCounted = 0;

    return (
        <div className="course-structure-stage glass-card">
            <div className="course-header mb-6" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <button className="back-btn" onClick={() => setAppStage('roadmap-choice')}>
                    <ArrowLeft size={18} />
                </button>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0 }}>🎓 {topic}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {isFetching ? '⏳ Loading course index...' : 'Select a book to start learning'}
                    </p>
                </div>
                {isFetching && <Loader2 className="animate-spin text-primary" size={20} />}
            </div>
            <div className="semesters-list" style={{ opacity: isFetching ? 0.6 : 1, pointerEvents: isFetching ? 'none' : 'auto' }}>
                {courseData?.semesters?.map((sem, i) => {
                    const isSemesterUnlocked = i === 0 || currentGlobalIndex >= totalTopicsCounted;
                    
                    // Increment counter for NEXT semester check
                    // Semester logic: All books in this semester must be done.
                    // (20 topics per book avg)
                    totalTopicsCounted += (sem.books?.length || 0) * 20;

                    return (
                        <div key={i} className={`semester-section mb-6 ${!isSemesterUnlocked ? 'locked-semester' : ''}`} style={{ opacity: isSemesterUnlocked ? 1 : 0.5 }}>
                            <h4 className="semester-title" style={{ marginBottom: '1rem', color: isSemesterUnlocked ? 'var(--primary-light)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                📅 Semester {sem.semester}
                                {!isSemesterUnlocked && <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>🔒 Locked</span>}
                            </h4>
                            <div className="books-grid" style={{ pointerEvents: isSemesterUnlocked ? 'auto' : 'none' }}>
                                {sem.books?.map((book, bi) => (
                                    <motion.button
                                        key={bi}
                                        className={`book-card ${isFetching ? 'loading' : ''} ${!isSemesterUnlocked ? 'locked' : ''}`}
                                        disabled={isFetching || cooldown > 0 || !isSemesterUnlocked}
                                        onClick={() => handleBookSelect(book)}
                                        whileHover={isSemesterUnlocked && !isFetching ? { y: -5, borderColor: 'var(--primary)' } : {}}
                                    >
                                        <span className="book-emoji">{isSemesterUnlocked ? (book.emoji || '📚') : '🔒'}</span>
                                        <div className="book-info">
                                            <h5>{book.title}</h5>
                                            <p>{isSemesterUnlocked ? book.description : 'Pehle purana semester complete karein!'}</p>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    );
                })}
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
                        {isFetching ? 'Generating your Course Track...' : `Please wait ${cooldown}s...`}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        {isFetching ? 'This may take a moment to perfect.' : 'Protecting AI resources.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CourseStructure;
