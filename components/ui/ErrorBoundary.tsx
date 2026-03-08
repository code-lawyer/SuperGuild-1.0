'use client';

import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <span className="material-symbols-outlined !text-[48px] text-red-400 mb-3">error</span>
                    <p className="text-sm text-slate-500">Something went wrong rendering this section.</p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="mt-3 text-xs text-primary hover:underline"
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
