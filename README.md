# DBMS Movie Dashboard

This project is split into a backend API and a React frontend.

You can execute one SQL file and view its output directly in the frontend.

## Folder Structure

```text
DBMS/
  package.json
  backend/
    server.js
    db.js
    controllers/
    models/
    routes/
  DATA/
    schema.sql
    dummy.sql
    user_query.sql
  frontend/
    package.json
    vite.config.js
    index.html
    src/
      App.jsx
      main.jsx
      components/
      services/
      utils/
      styles.css
```

## What Lives Where

- `backend/` contains the organized backend source of truth.
- `backend/db.js` manages the PostgreSQL connection.
- `frontend/src/services/` contains API calls.
- `frontend/src/utils/` contains reusable helpers.
- `frontend/src/components/` contains the UI pieces.
- `frontend/src/styles.css` contains shared global styles.
- `DATA/user_query.sql` is the file executed by backend endpoint `/query-file`.

## Run The App

1. Start the backend:

```bash
npm start
```

2. Start the frontend:

```bash
cd frontend
npm run dev
```

3. Open the Vite URL shown in the terminal.

## SQL File Workflow

1. Edit `DATA/user_query.sql`.
2. Write only a `SELECT` or `WITH` query.
3. Open the frontend and click **Run SQL File**.
4. The result set appears in a dynamic table.
