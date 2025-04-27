export interface Claim {
  text: string
  feedback: SummaryObject
  url: string
}

export interface User {
  _id?: string
  claims: Claim[]
  createdAt?: Date
  updatedAt?: Date
}

export type SummaryObject = {
  summary: string
  rating: number
  explanation: string
  sources: string[]
}
