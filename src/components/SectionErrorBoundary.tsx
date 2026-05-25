import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  sectionName?: string;
}
interface State {
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('[SectionErrorBoundary]', this.props.sectionName, error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="glass-panel rounded-lg p-6 m-4 border border-destructive/40">
        <div className="flex items-center gap-2 mb-3 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="text-sm font-semibold">
            Something went wrong{this.props.sectionName ? ` in ${this.props.sectionName}` : ''}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4 font-mono break-all">
          {this.state.error.message}
        </p>
        <button
          onClick={this.reset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      </div>
    );
  }
}
