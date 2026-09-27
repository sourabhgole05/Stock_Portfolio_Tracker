'use client'

import { useQuery } from '@tanstack/react-query'

export interface Asset {
  id: string
  name: string
  bseCode: string
  category: string
  cmp: number
  isActive: boolean
}

export function useAssets() {
  const { data = [], isLoading, isError } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
  })
  return { assets: data, isLoading, isError }
}
