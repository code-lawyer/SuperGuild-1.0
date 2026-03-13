export function SquareLoader({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="sg-loader">
                <div className="sg-loader-sq" />
                <div className="sg-loader-sq" />
                <div className="sg-loader-sq" />
                <div className="sg-loader-sq" />
                <div className="sg-loader-sq" />
                <div className="sg-loader-sq" />
                <div className="sg-loader-sq" />
            </div>
        </div>
    );
}
