import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI boundary caught an error', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-lg mx-auto rounded-lg border border-red-500/40 bg-slate-800 p-6 text-center text-slate-100">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-300">
            The page failed to render. Please retry.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="btn btn-sm mt-4 bg-red-500 border-none text-white hover:bg-red-400"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
