export interface Claim {
  text: string
  feedback: string
  url: string
}

export interface User {
  _id?: string
  claims: Claim[]
  createdAt?: Date
  updatedAt?: Date
}
