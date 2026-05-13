import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can also log the error to an error reporting service
    // console.error('Unhandled error caught by ErrorBoundary', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white text-slate-900 p-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
            <p className="mb-3">An unexpected error occurred while rendering the page.</p>
            <pre className="bg-slate-100 rounded p-3 text-sm overflow-auto">{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
