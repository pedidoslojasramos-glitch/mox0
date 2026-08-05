import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 15,
}) => {
  if (totalItems <= itemsPerPage) {
    return null; // No pagination needed if items fit on single page
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers array with ellipsis for many pages
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400">
      <div>
        Exibindo <span className="font-bold text-white">{startItem}</span> a{' '}
        <span className="font-bold text-white">{endItem}</span> de{' '}
        <span className="font-bold text-cyan-400">{totalItems}</span> registros (15 por página)
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed gap-1 text-xs px-2.5"
        >
          <ChevronLeft size={14} />
          <span>Anterior</span>
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (typeof page === 'string') {
              return (
                <span key={`ellipsis-${index}`} className="px-1.5 text-slate-500 font-bold">
                  ...
                </span>
              );
            }
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`h-8 min-w-[32px] px-2 rounded-md font-bold text-xs transition-colors ${
                  isActive
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed gap-1 text-xs px-2.5"
        >
          <span>Próximo</span>
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
