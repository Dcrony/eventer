import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
                    <div className="bg-gray-800 border border-red-500 rounded-lg shadow-lg p-8 max-w-md w-full">
                        <div className="flex items-center justify-center w-12 h-12 bg-red-900 rounded-full mx-auto mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>

                        <h1 className="text-xl font-bold text-white text-center mb-2">
                            Oops! Something went wrong
                        </h1>

                        <p className="text-gray-300 text-center mb-4">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-4 text-xs text-gray-400">
                                <summary className="cursor-pointer hover:text-gray-300 font-semibold">
                                    Error Details (Development Only)
                                </summary>
                                <pre className="mt-2 bg-gray-700 p-2 rounded overflow-auto max-h-48 text-red-300">
                                    {this.state.error.toString()}
                                </pre>
                                {this.state.errorInfo && (
                                    <pre className="mt-2 bg-gray-700 p-2 rounded overflow-auto max-h-48 text-red-300">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </details>
                        )}

                        <div className="flex gap-2 flex-col">
                            <button
                                onClick={this.handleReset}
                                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded transition"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded transition"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
