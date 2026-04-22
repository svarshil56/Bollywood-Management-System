import './QueryEditor.css';

export default function QueryEditor({ sqlText, onSqlTextChange, onRunQuery, loading }) {
    const onKeyDown = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            onRunQuery();
        }
    };

    return (
        <section className="query-editor panel">
            <div className="panel-header">
                <h2>SQL Editor</h2>
                <span className="panel-subtitle">Write your query here and run it directly from this page</span>
            </div>

            <label className="query-label" htmlFor="sql-editor-input">
                Query text
            </label>
            <textarea
                id="sql-editor-input"
                className="query-input"
                value={sqlText}
                onChange={(event) => onSqlTextChange(event.target.value)}
                onKeyDown={onKeyDown}
                spellCheck={false}
                placeholder="SELECT * FROM movie;"
                rows={9}
            />

            <div className="query-actions">
                <button className="refresh-button" onClick={onRunQuery} type="button" disabled={loading}>
                    {loading ? 'Running...' : 'Run Query'}
                </button>
                <span className="hint-text">Tip: press Ctrl+Enter to run</span>
            </div>
        </section>
    );
}
