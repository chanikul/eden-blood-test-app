'use client'

import { useCallback } from 'react'
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
  const searchParams = useSearchParams()

  const handleFilterChange = useCallback((filters: OrderFiltersType) => {
    // Create a new URLSearchParams object
    const params = new URLSearchParams()
    
    // Only add non-empty filters to query params
    if (filters.search?.trim()) {
      params.set('search', filters.search.trim())
    }
    
    if (filters.testType?.trim()) {
      params.set('testType', filters.testType.trim())
    }
    
    if (filters.status?.trim()) {
      params.set('status', filters.status.trim())
    }
    
    // Only add dates if they are set
    if (filters.dateRange.start) {
      params.set(
        'startDate',
        filters.dateRange.start.toISOString().split('T')[0]
      )
    }
    if (filters.dateRange.end) {
      params.set(
        'endDate',
        filters.dateRange.end.toISOString().split('T')[0]
      )
    }

    const newQueryString = params.toString()
    const newPath = `/admin/orders${newQueryString ? `?${newQueryString}` : ''}`
    
    // Get current query string for comparison
    const currentQueryString = searchParams ? searchParams.toString() : ''
    const currentPath = `/admin/orders${currentQueryString ? `?${currentQueryString}` : ''}`
    
    // Only update if the path has actually changed
    if (newPath !== currentPath) {
      router.push(newPath)
    }
  }, [router, searchParams])

  return (
    <OrderFilters
      testTypes={testTypes}
      initialFilters={initialFilters}
      onFilterChange={handleFilterChange}
    />
  )
}
