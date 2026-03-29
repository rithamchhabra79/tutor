import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Lightbulb, CheckSquare, Loader2 } from 'lucide-react';

const TutorSession = ({ 
    messages, 
    msgIndex, 
    mcqState, 
    handleMcqSubmit, 
    sendMessage, 
    isLoading, 
    cooldown, 
    language, 
    lastPrompt,
    VisualMode,
    QuickMode
}) => {
    const msg = messages[msgIndex];
    if (!msg) return null;

    // Try to use parsed, or auto-parse from raw content
    let parsedData = msg.parsed || null;
    const rawContent = typeof msg === 'string' ? msg : msg.content;

    if (!parsedData && rawContent) {
        // Try to extract and parse JSON from raw content
        try {
            let cleanRaw = rawContent.trim();
            // Handle common AI markdown wrapping
            if (cleanRaw.includes('```')) {
                const blockMatch = cleanRaw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (blockMatch) cleanRaw = blockMatch[1].trim();
            }

            const jsonMatch = cleanRaw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const candidate = JSON.parse(jsonMatch[0]);
                // Only use if it looks like our tutor schema
                if (candidate.explanation || candidate.redirect || candidate.analogy || candidate.mastery_check) {
                    parsedData = candidate;
                }
            }
        } catch (e) { 
            console.warn("Front-end heuristic parse failed:", e.message);
        }
    }

    if (!parsedData) {
        // Show as markdown but also offer a retry button
        const looksLikeRawJSON = rawContent && rawContent.trim().startsWith('{');
        return (
            <div className="message-container model-message">
                {looksLikeRawJSON ? (
                    <div className="raw-json-warning">
                        <span>⚠️ Response formatting issue</span>
                        <button
                            className="retry-explain-btn"
                            onClick={() => sendMessage(null, lastPrompt || 'Please explain again more simply')}
                            disabled={isLoading}
                        >
                            🔄 Samajh Nahi Aaya? Retry
                        </button>
                    </div>
                ) : null}
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const lang = match ? match[1] : '';
                        const content = String(children).replace(/\n$/, '');
                        if (!inline) {
                            if (lang === 'visual') return <VisualMode content={content} />;
                            if (lang === 'quick') return <QuickMode>{content}</QuickMode>;
                        }
                        return <code className={className} {...props}>{children}</code>;
                    }
                }}>{rawContent}</ReactMarkdown>
            </div>
        );
    }

    const p = parsedData;

    // Handle redirect Off-Topic Guard
    if (p.redirect) {
        return (
            <div className="message-container model-message">
                <div className="tutor-card warning">
                    <div className="card-header">
                        <span className="card-icon">🛑</span> Off-Topic Guard
                    </div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.redirect}</ReactMarkdown>
                </div>
            </div>
        );
    }

    return (
        <div className="message-container model-message rich-response">
            {/* 1. Explanation */}
            {p.explanation && (
                <div className="explanation-section">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]} 
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                const lang = match ? match[1] : '';
                                const content = String(children).replace(/\n$/, '');
                                if (!inline) {
                                    if (lang === 'visual') return <VisualMode content={content} />;
                                    if (lang === 'quick') return <QuickMode>{content}</QuickMode>;
                                }
                                return <code className={className} {...props}>{children}</code>;
                            }
                        }}
                    >
                        {/* 🛠️ NAKED BLOCK FIX: Robustly open and then auto-close naked blocks at end of string if needed */}
                        {(() => {
                            let text = p.explanation
                                .replace(/^(?:.*)?visual\n/gim, '```visual\n')
                                .replace(/^(?:.*)?quick\n/gim, '```quick\n')
                                .replace(/<\/svg>(?!\s*```)/g, '</svg>\n```');
                            
                            // 🧱 Safety Audit: If a block was opened but never closed, close it at the end
                            const openBlocks = (text.match(/```(visual|quick)/g) || []).length;
                            const closeBlocks = (text.match(/```$/gm) || []).length;
                            if (openBlocks > closeBlocks) {
                                text += '\n```';
                            }
                            return text;
                        })()}
                    </ReactMarkdown>
                </div>
            )}

            {/* 2. Analogy */}
            {p.analogy && (
                <div className="tutor-card analogy-card">
                    <div className="card-header">
                        <Lightbulb size={16} className="card-icon" /> Real-world Analogy
                    </div>
                    <p>{p.analogy}</p>
                </div>
            )}

            {/* 3. Hint */}
            {p.hint && (
                <div className="tutor-card hint-card">
                    <div className="card-header">
                        <span>💡</span> Hint
                    </div>
                    <p>{p.hint}</p>
                </div>
            )}

            {/* 4. Quick Check (MCQ) — shown before Task */}
            {p.mastery_check && p.mastery_check.options && (
                <div className="tutor-card mcq-card">
                    <div className="card-header">
                        <span>🎯</span> Quick Check
                    </div>
                    <p className="mcq-question">{p.mastery_check.question}</p>

                    <div className="mcq-options">
                        {p.mastery_check.options.map((opt, optIdx) => {
                            const mcq = mcqState[msgIndex];
                            const isSelected = mcq?.selected === optIdx;
                            const isSubmitted = mcq?.submitted;
                            const isCorrectOpt = optIdx === p.mastery_check.correct_index;

                            let btnClass = 'mcq-option-btn';
                            if (isSubmitted) {
                                if (isCorrectOpt) btnClass += ' correct';
                                else if (isSelected) btnClass += ' incorrect';
                                else btnClass += ' disabled';
                            } else if (isSelected) {
                                btnClass += ' selected';
                            }

                            return (
                                <button
                                    key={optIdx}
                                    className={btnClass}
                                    disabled={isSubmitted}
                                    onClick={() => handleMcqSubmit(msgIndex, optIdx, p.mastery_check.correct_index, opt)}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>

                    {mcqState[msgIndex]?.submitted && (
                        <div className={`mcq-feedback ${mcqState[msgIndex].isCorrect ? 'positive' : 'negative'}`}>
                            {mcqState[msgIndex].isCorrect
                                ? `✨ Correct! +20 XP`
                                : `❌ Oops! The correct answer was: ${p.mastery_check.options[p.mastery_check.correct_index]}`}
                        </div>
                    )}
                </div>
            )}

            {/* 5. Your Task — shown after Quick Check */}
            {p.task && (
                <div className="tutor-card task-card">
                    <div className="card-header">
                        <CheckSquare size={16} className="card-icon" /> Your Task
                    </div>
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                const lang = match ? match[1] : '';
                                if (!inline && lang === 'quick') return <QuickMode>{String(children)}</QuickMode>;
                                return <code className={className} {...props}>{children}</code>;
                            }
                        }}
                    >{p.task}</ReactMarkdown>
                </div>
            )}

            {/* 6. Universal Action Buttons (Deep Dive & Retry) */}
            <div className="msg-action-row">
                <button
                    className="deep-dive-btn"
                    onClick={() => sendMessage(null, language === 'English' ? 'Explain this in great detail with more examples.' : 'Iske baare mein bohot vistaar se samjhao (Explain in Detail)')}
                    disabled={isLoading || cooldown > 0}
                    title="Get an in-depth explanation"
                >
                    {cooldown > 0 ? `Wait ${cooldown}s` : <>🔬 {language === 'English' ? 'Deep Dive' : 'Explain in Detail'}</>}
                </button>
                <button
                    className="retry-explain-btn"
                    onClick={() => sendMessage(null, 'Yeh mujhe samajh nahi aaya. Please isse aur simple aur short tarike se explain karo')}
                    disabled={isLoading || cooldown > 0}
                    title="Ask AI to explain more simply"
                >
                    {cooldown > 0 ? `${cooldown}s` : '🔄 Retry'}
                </button>
            </div>
        </div>
    );
};

export default TutorSession;
