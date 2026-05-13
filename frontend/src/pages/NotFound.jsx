import React from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="bg-primary-50 dark:bg-primary-900/20 text-primary-500 p-6 rounded-full mb-8">
        <Search size={48} />
      </div>
      <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4">404</h1>
      <p className="text-xl text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary-500/30"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
