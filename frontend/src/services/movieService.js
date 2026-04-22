export async function fetchMovies() {
  const response = await fetch("/movies");

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function executeSqlQuery(sqlText) {
  const response = await fetch("/query", {
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
