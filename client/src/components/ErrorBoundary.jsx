import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={styles.overlay}>
                    {/* Decorative blobs */}
                    <div style={styles.blobTopRight} />
                    <div style={styles.blobBottomLeft} />

                    <div style={styles.card}>
                        {/* Logo / Brand */}
                        <div style={styles.brandRow}>
                            <span style={styles.brandDot} />
                            <span style={styles.brandName}>TickiSpot</span>
                        </div>

                        {/* Icon */}
                        <div style={styles.iconWrap}>
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#fff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>

                        {/* Headline */}
                        <h1 style={styles.heading}>Something went wrong</h1>
                        <p style={styles.sub}>
                            We hit an unexpected snag. Don't worry — your event isn't going anywhere.
                        </p>

                        {/* Divider */}
                        <div style={styles.divider} />

                        {/* Buttons */}
                        <div style={styles.btnGroup}>
                            <button
                                onClick={this.handleReset}
                                style={styles.btnPrimary}
                                onMouseEnter={e => (e.currentTarget.style.background = '#be185d')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#db2777')}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ marginRight: 8, verticalAlign: 'middle' }}
                                    aria-hidden="true"
                                >
                                    <polyline points="1 4 1 10 7 10" />
                                    <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                                </svg>
                                Try Again
                            </button>

                            <button
                                onClick={() => (window.location.href = '/')}
                                style={styles.btnOutline}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = '#fdf2f8';
                                    e.currentTarget.style.borderColor = '#db2777';
                                    e.currentTarget.style.color = '#db2777';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = '#f9a8d4';
                                    e.currentTarget.style.color = '#9d174d';
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ marginRight: 8, verticalAlign: 'middle' }}
                                    aria-hidden="true"
                                >
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                Go Home
                            </button>
                        </div>

                        {/* Dev error details */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details style={styles.details}>
                                <summary style={styles.detailsSummary}>
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ marginRight: 6, verticalAlign: 'middle' }}
                                        aria-hidden="true"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    Error details (dev only)
                                </summary>
                                <pre style={styles.errorPre}>{this.state.error.toString()}</pre>
                                {this.state.errorInfo && (
                                    <pre style={styles.errorPre}>
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </details>
                        )}

                        {/* Footer note */}
                        <p style={styles.footerNote}>
                            If this keeps happening,{' '}
                            <a href="mailto:support@tickispot.com" style={styles.link}>
                                contact support
                            </a>
                            .
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles = {
    overlay: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#fff0f6',
        padding: '1.5rem',
        overflow: 'hidden',
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    },
    blobTopRight: {
        position: 'absolute',
        top: '-80px',
        right: '-80px',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: '#fbcfe8',
        opacity: 0.45,
        pointerEvents: 'none',
    },
    blobBottomLeft: {
        position: 'absolute',
        bottom: '-100px',
        left: '-100px',
        width: '360px',
        height: '360px',
        borderRadius: '50%',
        background: '#f9a8d4',
        opacity: 0.3,
        pointerEvents: 'none',
    },
    card: {
        position: 'relative',
        background: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #fce7f3',
        padding: '2.5rem 2rem',
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
        zIndex: 1,
    },
    brandRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '1.5rem',
    },
    brandDot: {
        display: 'inline-block',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: '#db2777',
    },
    brandName: {
        fontWeight: 700,
        fontSize: '15px',
        letterSpacing: '0.5px',
        color: '#9d174d',
    },
    iconWrap: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '68px',
        height: '68px',
        borderRadius: '50%',
        background: '#db2777',
        margin: '0 auto 1.5rem',
        border: '4px solid #fce7f3',
    },
    heading: {
        fontSize: '22px',
        fontWeight: 700,
        color: '#831843',
        margin: '0 0 0.6rem',
        lineHeight: 1.3,
    },
    sub: {
        fontSize: '14px',
        color: '#9d174d',
        lineHeight: 1.6,
        margin: '0 0 1.5rem',
        opacity: 0.85,
    },
    divider: {
        height: '1px',
        background: '#fce7f3',
        margin: '0 0 1.5rem',
    },
    btnGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '1.5rem',
    },
    btnPrimary: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '12px 20px',
        background: '#db2777',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.2s',
        letterSpacing: '0.2px',
    },
    btnOutline: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '11px 20px',
        background: 'transparent',
        color: '#9d174d',
        border: '1.5px solid #f9a8d4',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s, color 0.2s',
        letterSpacing: '0.2px',
    },
    details: {
        textAlign: 'left',
        marginBottom: '1rem',
        background: '#fdf2f8',
        border: '1px solid #fce7f3',
        borderRadius: '8px',
        padding: '10px 14px',
    },
    detailsSummary: {
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 600,
        color: '#9d174d',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
    },
    errorPre: {
        marginTop: '10px',
        fontSize: '11px',
        color: '#be185d',
        background: '#fff1f5',
        border: '1px solid #fce7f3',
        borderRadius: '6px',
        padding: '10px',
        overflowX: 'auto',
        maxHeight: '160px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    footerNote: {
        fontSize: '12px',
        color: '#be185d',
        opacity: 0.7,
        margin: 0,
    },
    link: {
        color: '#db2777',
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
    },
};

export default ErrorBoundary;