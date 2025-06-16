import { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';

interface UseAdminSearchProps {
    onSearch: (searchTerm: string) => void;
    delay?: number;
}

export const useAdminSearch = ({ onSearch, delay = 300 }: UseAdminSearchProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Create a debounced search function
    const debouncedSearch = useCallback(
        debounce((term: string) => {
            setIsSearching(false);
            onSearch(term);
        }, delay),
        [onSearch, delay]
    );

    // Handle search input changes
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setIsSearching(true);
        debouncedSearch(value);
    };

    // Handle form submission (immediate search)
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        debouncedSearch.cancel();
        setIsSearching(false);
        onSearch(searchTerm);
    };

    // Clear search
    const clearSearch = () => {
        setSearchTerm('');
        setIsSearching(false);
        debouncedSearch.cancel();
        onSearch('');
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    return {
        searchTerm,
        isSearching,
        handleSearchChange,
        handleSearchSubmit,
        clearSearch,
    };
};