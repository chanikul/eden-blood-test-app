import { Order as PrismaOrder } from '@prisma/client'

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  DISPATCHED = 'DISPATCHED',
  CANCELLED = 'CANCELLED',
}

export type ShippingAddress = {
  line1: string
  line2?: string
  city: string
  state?: string
  postal_code: string
  country: string
}

export interface Order extends Omit<PrismaOrder, 'internalNotes' | 'dispatchedAt' | 'dispatchedBy' | 'shippingAddress'> {
  internalNotes?: string | null
  dispatchedAt?: Date | null
  dispatchedBy?: string | null
  shippingAddress?: ShippingAddress | null
}
