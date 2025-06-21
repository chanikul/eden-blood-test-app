'use client'

import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { OrderStatus } from '../../types'
import { useDebounce } from '../../lib/hooks/useDebounce'

interface OrderFiltersProps {
  testTypes: string[]
  initialFilters: OrderFilters
  onFilterChange: (filters: OrderFilters) => void
}

export interface OrderFilters {
  search: string
  testType: string
  status: string
  dateRange: {
    start: Date | null
    end: Date | null
  }
}

const defaultFilters: OrderFilters = {
  search: '',
  testType: '',
  status: '',
  dateRange: {
    start: null,
    end: null,
  },
}

export function OrderFilters({ testTypes, initialFilters, onFilterChange }: OrderFiltersProps) {
  const [filters, setFilters] = useState<OrderFilters>(initialFilters)
  const debouncedFilters = useDebounce(filters, 300)

  useEffect(() => {
    onFilterChange(debouncedFilters)
  }, [debouncedFilters, onFilterChange])

  const handleClearFilters = () => {
    setFilters(defaultFilters)
  }

  const handleFilterChange = (
    key: keyof OrderFilters,
    value: string | { start: Date | null; end: Date | null }
  ) => {
    const newFilters = {
      ...filters,
      [key]: value,
    }
    setFilters(newFilters)
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6 z-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">Filter Orders</h2>
        {(filters.search || filters.testType || filters.status || filters.dateRange.start || filters.dateRange.end) && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Clear All Filters
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Search
          </label>
          <input
            type="text"
            placeholder="Search by name or email"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-600"
          />
        </div>

        {/* Test Type Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Test Type
          </label>
          <div className="relative">
            <select
              value={filters.testType}
              onChange={(e) => handleFilterChange('testType', e.target.value)}
              className="w-full appearance-none rounded-md border-gray-300 bg-white pl-3 pr-10 py-2 text-base text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="" className="text-gray-900">All Tests</option>
              {testTypes.map((type) => (
                <option key={type} value={type} className="py-2 text-gray-900">
                  {type}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Status
          </label>
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full appearance-none rounded-md border-gray-300 bg-white pl-3 pr-10 py-2 text-base text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="" className="text-gray-900">All Status</option>
              <option value="PENDING" className="text-gray-900">Pending</option>
              <option value="PAID" className="text-gray-900">Paid</option>
              <option value="DISPATCHED" className="text-gray-900">Dispatched</option>
              <option value="CANCELLED" className="text-gray-900">Cancelled</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Date Range
          </label>
          <div className="flex space-x-2">
            <DatePicker
              selected={filters.dateRange.start}
              onChange={(date) =>
                handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  start: date,
                })
              }
              selectsStart
              startDate={filters.dateRange.start}
              endDate={filters.dateRange.end}
              placeholderText="Start Date"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
              dateFormat="dd/MM/yyyy"
            />
            <DatePicker
              selected={filters.dateRange.end}
              onChange={(date) =>
                handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  end: date,
                })
              }
              selectsEnd
              startDate={filters.dateRange.start}
              endDate={filters.dateRange.end}
              placeholderText="End Date"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
              dateFormat="dd/MM/yyyy"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
