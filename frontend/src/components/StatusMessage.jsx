export default function StatusMessage({ loading, error }) {
    if (loading) {
        return <p className="state-message">Running SQL query and loading data...</p>;
    }

    if (error) {
        return <p className="state-message error">{error}</p>;
    }

    return null;
}