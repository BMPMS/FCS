import React, { useState, ChangeEvent, FC } from 'react';

interface FloatingSearchProps {
    entriesRef: React.RefObject<string[]>;
    onSelect: (selected: string[]) => void;
}

const FloatingSearch: FC<FloatingSearchProps> = ({ entriesRef, onSelect }) => {
    const [query, setQuery] = useState('');
    const [filtered, setFiltered] = useState<string[]>([]);
    const entries = entriesRef ? entriesRef.current : [];
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        setQuery(input);

        const matches = input === "" ? [] : entries.filter((item) =>
            item.toLowerCase().includes(input.toLowerCase())
        );

        setFiltered(matches);
        onSelect(matches);
    };

    return (
        <div className={`fixed top-[65px]  left-[5px] w-[200px] z-50 `}>
            {/* Show count only if query has text */}
            <div className="mb-1 text-xs text-gray-600">
                {query.length > 0 && (
                    <>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</>
                )}
            </div>

            <input
                id="nodeSearch"
                type="text"
                value={query}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Search nodes to highlight"
                className="w-full h-[30px] px-1 py-0.5 text-sm bg-white border border-gray-300 rounded"
            />
        </div>
    );
};

export default FloatingSearch;
