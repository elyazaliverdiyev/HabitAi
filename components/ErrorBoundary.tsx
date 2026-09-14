import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary — catches rendering errors in child components.
 * Critical for React.lazy() chunks that may fail to load.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <div className="text-4xl">⚠️</div>
                    <div className="text-sm font-bold text-textPrimary">
                        Что-то пошло не так
                    </div>
                    <div className="text-xs text-textSecondary max-w-xs">
                        {this.state.error?.message || 'Произошла ошибка при загрузке компонента'}
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="mt-2 px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all"
                    >
                        Попробовать снова
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
