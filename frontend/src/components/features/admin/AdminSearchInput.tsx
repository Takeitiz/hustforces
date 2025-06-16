import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface AdminSearchInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClear: () => void;
    placeholder?: string;
    isSearching?: boolean;
    className?: string;
}

export const AdminSearchInput: React.FC<AdminSearchInputProps> = ({
                                                                      value,
                                                                      onChange,
                                                                      onSubmit,
                                                                      onClear,
                                                                      placeholder = "Search...",
                                                                      isSearching = false,
                                                                      className = "",
                                                                  }) => {
    return (
        <form onSubmit={onSubmit} className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="pl-10 pr-10 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                />
                <div className="absolute left-3 top-2.5 h-5 w-5 text-gray-400">
                    {isSearching ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <Search />
                    )}
                </div>
                {value && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>
            <button type="submit" className="sr-only">
                Search
            </button>
        </form>
    );
};