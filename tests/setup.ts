// Tests run in Node (no browser). fake-indexeddb provides an in-memory
// IndexedDB so the Dexie data layer can be exercised exactly as it runs in the
// app. It is a dev/test-only dependency and is never bundled into the app.
import 'fake-indexeddb/auto';
