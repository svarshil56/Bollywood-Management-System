const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export async function fetchMovies() {
  const response = await fetch(`${API_BASE_URL}/movies`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function executeSqlQuery(sqlText) {
  const response = await fetch(`${API_BASE_URL}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql: sqlText }),
  });

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || fallback);
    }

    const text = await response.text();
    throw new Error(text || fallback);
  }

  return response.json();
}

export async function fetchDatabaseSchema() {
  const response = await fetch(`${API_BASE_URL}/schema`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}


