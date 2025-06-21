import { Order as PrismaOrder } from '@prisma/client'

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  DISPATCHED = 'DISPATCHED',
  CANCELLED = 'CANCELLED',
  READY = 'READY',
}

export type ShippingAddress = {
  line1: string
  line2?: string | null
  city: string
  state?: string | null
  postal_code: string
  country: string
}

export interface Order extends Omit<PrismaOrder, 'internalNotes' | 'dispatchedAt' | 'dispatchedBy' | 'shippingAddress'> {
  internalNotes?: string | null
  dispatchedAt?: Date | null
  dispatchedBy?: string | null
  shippingAddress?: string | null
}
