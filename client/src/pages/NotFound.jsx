import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-extrabold text-pink-500">404</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/events"
          className="rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-600"
        >
          Browse events
        </Link>
        <Link
          to="/"
          className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
