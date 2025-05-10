'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { OrderFilters, type OrderFilters as OrderFiltersType } from './OrderFilters'

export function OrderFiltersWrapper({
  testTypes,
  initialFilters,
}: {
  testTypes: string[]
  initialFilters: OrderFiltersType
}) {
  const router = useRouter()

  const handleFilterChange = (filters: OrderFiltersType) => {
    const queryParams = new URLSearchParams()
    
    // Only add non-empty filters to query params
    if (filters.search?.trim()) {
      queryParams.set('search', filters.search.trim())
    }
    
    // Only add test type if it's not empty (not 'All Tests')
    if (filters.testType?.trim()) {
      queryParams.set('testType', filters.testType.trim())
    }
    
    // Only add status if it's not empty (not 'All Status')
    if (filters.status?.trim()) {
      queryParams.set('status', filters.status.trim())
    }
    
    // Only add dates if they are set
    if (filters.dateRange.start) {
      queryParams.set(
        'startDate',
        filters.dateRange.start.toISOString().split('T')[0]
      )
    }
    if (filters.dateRange.end) {
      queryParams.set(
        'endDate',
        filters.dateRange.end.toISOString().split('T')[0]
      )
    }

    const queryString = queryParams.toString()
    const newPath = `/admin/orders${queryString ? `?${queryString}` : ''}`
    const currentPath = window.location.pathname + window.location.search
    
    // Only update if the path has actually changed
    if (newPath !== currentPath) {
      router.replace(newPath)
      router.refresh()
    }
  }

  return (
    <OrderFilters
      testTypes={testTypes}
      initialFilters={initialFilters}
      onFilterChange={handleFilterChange}
    />
  )
}
