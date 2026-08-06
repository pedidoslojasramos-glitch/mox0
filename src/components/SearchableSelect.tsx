import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  code?: string;
  sublabel?: string;
  category?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
  clearable?: boolean;
  maxDisplayWhenEmpty?: number;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção...',
  searchPlaceholder = 'Digite para pesquisar...',
  disabled = false,
  className = '',
  emptyMessage = 'Nenhum resultado encontrado',
  clearable = false,
  maxDisplayWhenEmpty = 12
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const query = searchQuery.trim().toLowerCase();

  const filteredOptions = options.filter(o => {
    if (!query) return true;
    const matchLabel = o.label.toLowerCase().includes(query);
    const matchCode = o.code ? o.code.toLowerCase().includes(query) : false;
    const matchSublabel = o.sublabel ? o.sublabel.toLowerCase().includes(query) : false;
    const matchCategory = o.category ? o.category.toLowerCase().includes(query) : false;
    return matchLabel || matchCode || matchSublabel || matchCategory;
  });

  // Limit display when search is empty and option list is large
  const displayOptions = !query && options.length > maxDisplayWhenEmpty
    ? filteredOptions.slice(0, maxDisplayWhenEmpty)
    : filteredOptions;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 px-3 py-2 bg-slate-900 border rounded-lg flex items-center justify-between text-xs font-medium text-slate-200 transition-all ${
          isOpen
            ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
            : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="truncate pr-2">
          {selectedOption ? (
            <span className="flex items-center gap-1.5 text-white font-semibold">
              {selectedOption.code && (
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1 py-0.2 rounded">
                  #{selectedOption.code}
                </span>
              )}
              {selectedOption.label}
              {selectedOption.sublabel && (
                <span className="text-slate-400 text-[11px] font-normal">
                  ({selectedOption.sublabel})
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {clearable && value && (
            <span
              onClick={handleClear}
              className="p-1 hover:text-rose-400 text-slate-500 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              title="Limpar seleção"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`}
          />
        </div>
      </button>

      {/* Popover list */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search input field */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/80 flex items-center gap-2">
            <Search size={14} className="text-cyan-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-0 py-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-500 hover:text-slate-200 p-1"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Search count indicator */}
          <div className="px-3 py-1 bg-slate-950/40 border-b border-slate-800/50 flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
              {query ? `Filtro: "${searchQuery}"` : 'Opções'}
            </span>
            <span className="text-[9px] font-mono text-cyan-400">
              {filteredOptions.length} encontrado(s)
            </span>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto p-1 custom-scrollbar space-y-0.5">
            {displayOptions.length > 0 ? (
              displayOptions.map(option => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    } ${option.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex flex-col gap-0.5 truncate pr-2">
                      <div className="flex items-center gap-2 truncate">
                        {option.code && (
                          <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1 rounded uppercase">
                            #{option.code}
                          </span>
                        )}
                        <span className="truncate">{option.label}</span>
                      </div>
                      {option.sublabel && (
                        <span className="text-[10px] text-slate-400 truncate font-normal">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-cyan-400 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-500 text-xs">
                {emptyMessage}
              </div>
            )}

            {!query && options.length > maxDisplayWhenEmpty && (
              <div className="px-3 py-2 text-center text-[10px] text-slate-500 border-t border-slate-800/60 bg-slate-950/30 font-medium">
                Exibindo as primeiras {maxDisplayWhenEmpty} de {options.length} opções. Digite no campo acima para filtrar.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
