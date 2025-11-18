

import React from 'react';

interface State {
  hasError: boolean;
}

interface Props {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // FIX: In a React class component, state must be initialized. The constructor is added to set the initial state and call `super(props)` to ensure props are available, which fixes access to `this.state` and `this.props`.
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <h1 className="text-3xl font-bold mb-4">Oops! Algo salió mal.</h1>
            <p className="text-lg mb-8">Hubo un error inesperado en la aplicación.</p>
            <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
                Recargar Página
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}
