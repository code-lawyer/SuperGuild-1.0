'use client';

import React from 'react';

interface MarkdownProps {
    content: string;
    className?: string;
}

/**
 * A lightweight, zero-dependency Markdown renderer for basic formatting.
 * Handles headers, bold, bullet points, and links.
 */
export default function Markdown({ content, className = '' }: MarkdownProps) {
    const lines = content.split('\n');

    const renderLine = (line: string, index: number) => {
        // Headers
        if (line.startsWith('### ')) {
            return <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-slate-900 dark:text-white">{line.slice(4)}</h3>;
        }
        if (line.startsWith('## ')) {
            return <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">{line.slice(3)}</h2>;
        }
        if (line.startsWith('# ')) {
            return <h1 key={index} className="text-2xl font-black mt-8 mb-4 text-slate-900 dark:text-white uppercase tracking-tight">{line.slice(2)}</h1>;
        }

        // Bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const text = line.trim().slice(2);
            return (
                <li key={index} className="ml-4 mb-1 list-disc text-slate-600 dark:text-slate-400">
                    {parseInline(text)}
                </li>
            );
        }

        // Empty line
        if (line.trim() === '') {
            return <div key={index} className="h-4" />;
        }

        // Regular paragraph
        return (
            <p key={index} className="mb-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                {parseInline(line)}
            </p>
        );
    };

    // Very basic inline parser for **bold** and [links]
    const parseInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('[') && part.includes('](')) {
                const match = part.match(/\[(.*?)\]\((.*?)\)/);
                if (match) {
                    return (
                        <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                            {match[1]}
                        </a>
                    );
                }
            }
            return part;
        });
    };

    return (
        <div className={`markdown-body ${className}`}>
            {lines.map((line, i) => renderLine(line, i))}
        </div>
    );
}
