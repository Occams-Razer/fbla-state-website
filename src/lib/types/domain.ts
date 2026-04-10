export type ItemStatus = "PENDING" | "APPROVED" | "REJECTED" | "CLAIMED";
export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED" | "PICKED_UP";

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  dateFound: string;
  imageUrl: string;
  status: ItemStatus;
  createdAt: string;
  isDeleted: boolean;
}

export interface Claim {
  id: string;
  itemId: string;
  name: string;
  email: string;
  proofOfOwnership: string;
  locationLost: string;
  status: ClaimStatus;
  createdAt: string;
  isDeleted: boolean;
  item?: Item;
}

export interface AdminSession {
  authenticated: boolean;
  username: string;
}

export interface ClaimantProfile {
  name: string;
  email: string;
}
