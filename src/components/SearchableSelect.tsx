import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value);

  // Recalculate fixed positioning for portal popover
  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const placeAbove = spaceBelow < 280 && spaceAbove > spaceBelow;
    const width = Math.max(rect.width, 240);
    let left = rect.left;

    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }

    if (placeAbove) {
      setPopoverStyle({
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 4}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${Math.min(320, spaceAbove - 12)}px`,
        zIndex: 999999,
      });
    } else {
      setPopoverStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${Math.min(320, spaceBelow - 12)}px`,
        zIndex: 999999,
      });
    }
  };

  // Manage open state, event listeners, focus and click outside
  useEffect(() => {
    if (isOpen) {
      updatePosition();

      const handleScrollOrResize = () => {
        updatePosition();
      };

      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          containerRef.current &&
          !containerRef.current.contains(target) &&
          popoverRef.current &&
          !popoverRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      document.addEventListener('mousedown', handleClickOutside);

      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
        document.removeEventListener('mousedown', handleClickOutside);
      };
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

      {/* Popover list via React Portal */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            className="bg-slate-900 border border-slate-700/90 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Search input field */}
            <div className="p-2 border-b border-slate-800 bg-slate-950/90 flex items-center gap-2 shrink-0">
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
            <div className="px-3 py-1 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between shrink-0">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                {query ? `Filtro: "${searchQuery}"` : 'Opções'}
              </span>
              <span className="text-[9px] font-mono text-cyan-400 font-bold">
                {filteredOptions.length} encontrado(s)
              </span>
            </div>

            {/* Options list */}
            <div className="flex-1 overflow-y-auto p-1 custom-scrollbar space-y-0.5 min-h-0">
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
                <div className="px-3 py-2 text-center text-[10px] text-slate-500 border-t border-slate-800/60 bg-slate-950/40 font-medium shrink-0">
                  Exibindo as primeiras {maxDisplayWhenEmpty} de {options.length} opções. Digite no campo acima para filtrar.
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
