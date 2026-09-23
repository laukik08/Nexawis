import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function EmployeeFilters() {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[--color-text-muted]" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 bg-[--color-surface-2] border border-[--color-border-strong] rounded-xl text-sm placeholder-[--color-text-muted] text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent-cyan] transition-all"
            placeholder="Search employees, skills, or roles..."
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button 
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-[--color-surface-1] border border-[--color-border-strong] hover:bg-[--color-surface-2] text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-xl transition-colors text-sm font-bold"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          
          <button className="flex items-center justify-center p-2.5 bg-[--color-surface-1] border border-[--color-border-strong] hover:bg-[--color-surface-2] text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-xl transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-5 bg-[--color-surface-1] border border-[--color-border-strong] rounded-2xl shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Department Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider">Department</label>
                  <select className="w-full bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] text-sm rounded-lg px-3 py-2 outline-none focus:border-[--color-accent-cyan]">
                    <option value="">All Departments</option>
                    <option value="engineering">Engineering</option>
                    <option value="product">Product</option>
                    <option value="design">Design</option>
                    <option value="data">Data</option>
                  </select>
                </div>

                {/* Role Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider">Role</label>
                  <select className="w-full bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] text-sm rounded-lg px-3 py-2 outline-none focus:border-[--color-accent-cyan]">
                    <option value="">All Roles</option>
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider">Status</label>
                  <select className="w-full bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] text-sm rounded-lg px-3 py-2 outline-none focus:border-[--color-accent-cyan]">
                    <option value="">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="allocated">Allocated</option>
                    <option value="overloaded">Overloaded</option>
                  </select>
                </div>

                {/* Wellbeing Risk Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider">Risk Level</label>
                  <select className="w-full bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] text-sm rounded-lg px-3 py-2 outline-none focus:border-[--color-accent-cyan]">
                    <option value="">All Risk Levels</option>
                    <option value="low">Low Risk</option>
                    <option value="moderate">Moderate Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>

              </div>
              
              <div className="mt-5 flex justify-end">
                <button 
                  onClick={() => setFiltersOpen(false)}
                  className="text-sm font-bold text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
