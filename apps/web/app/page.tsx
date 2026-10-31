import { ApiStatus } from "./api-status";

export default function HomePage() {
  return (
    <main className="home">
      <h1>School Management System</h1>
      <p>Monorepo scaffold: web and API are running.</p>
      <ApiStatus />
    </main>
  );
}
