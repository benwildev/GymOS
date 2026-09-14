export const Role = {
  OWNER: "OWNER",
  MEMBER: "MEMBER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Status = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type Status = (typeof Status)[keyof typeof Status];

export const MembershipStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  FROZEN: "FROZEN",
  CANCELLED: "CANCELLED",
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CASH: "CASH",
  BKASH: "BKASH",
  NAGAD: "NAGAD",
  CARD: "CARD",
  BANK: "BANK",
  OTHER: "OTHER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const ExpenseCategory = {
  RENT: "RENT",
  ELECTRICITY: "ELECTRICITY",
  WATER: "WATER",
  EQUIPMENT: "EQUIPMENT",
  MAINTENANCE: "MAINTENANCE",
  CLEANING: "CLEANING",
  MARKETING: "MARKETING",
  SALARY: "SALARY",
  INTERNET: "INTERNET",
  OTHER: "OTHER",
} as const;
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export const CheckInMethod = {
  MANUAL: "MANUAL",
  QR_CODE: "QR_CODE",
  BIOMETRIC: "BIOMETRIC",
} as const;
export type CheckInMethod = (typeof CheckInMethod)[keyof typeof CheckInMethod];

export const ClassStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type ClassStatus = (typeof ClassStatus)[keyof typeof ClassStatus];

export const ScheduleStatus = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;
export type ScheduleStatus = (typeof ScheduleStatus)[keyof typeof ScheduleStatus];

export const BookingStatus = {
  BOOKED: "BOOKED",
  CANCELLED: "CANCELLED",
  ATTENDED: "ATTENDED",
  NO_SHOW: "NO_SHOW",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const PlanStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  COMPLETED: "COMPLETED",
} as const;
export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus];

