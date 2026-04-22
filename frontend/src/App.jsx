import { useEffect, useMemo, useState } from 'react';
import DashboardHeader from './components/DashboardHeader';
import MovieTable from './components/MovieTable';
import QueryEditor from './components/QueryEditor';
import StatsGrid from './components/StatsGrid';
import StatusMessage from './components/StatusMessage';
import { executeSqlQuery } from './services/movieService';

const DEFAULT_SQL = `SET search_path TO movie_db;

SELECT *
FROM movie
LIMIT 20;`;

export default function App() {
    const [queryResult, setQueryResult] = useState({
        source: 'frontend SQL editor',
        rowCount: 0,
        columns: [],
        rows: [],
    });
    const [sqlText, setSqlText] = useState(DEFAULT_SQL);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function runEditorQuery() {
        try {
            setLoading(true);
            setError('');

            const data = await executeSqlQuery(sqlText);
            setQueryResult(data);
        } catch (fetchError) {
            setError(fetchError.message || 'Failed to execute SQL query');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        runEditorQuery();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rowCount = queryResult.rows.length;
    const columnCount = useMemo(() => queryResult.columns.length, [queryResult.columns]);

    return (
        <main className="app-shell">
            <DashboardHeader />
            <QueryEditor sqlText={sqlText} onSqlTextChange={setSqlText} onRunQuery={runEditorQuery} loading={loading} />
            <StatsGrid rowCount={rowCount} columnCount={columnCount} sourceFile={queryResult.source} />
            <StatusMessage loading={loading} error={error} />
            {!loading && !error && <MovieTable rows={queryResult.rows} columns={queryResult.columns} />}
        </main>
    );
}