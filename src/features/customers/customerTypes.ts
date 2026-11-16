export interface Customer {
  _id: string;
  customerCode: string;
  customerLegalName: string;
  gstin: string;
  gstState: string;
  stateCode: string;
  billingAddress: string;
  siteAddress: string;
  contactPerson: string;
  phoneNumber: string;
  emailAddress: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CustomerPayload = Omit<Customer, "_id" | "createdAt" | "updatedAt">;