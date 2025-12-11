// Общие типы для frontend и backend

export enum UserRole {
  GUEST = 'GUEST',
  RENTER = 'RENTER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum RatingCriterion {
  TECHNICAL_CONDITION = 'TECHNICAL_CONDITION',
  CLEANLINESS = 'CLEANLINESS',
  SAFETY = 'SAFETY',
  COMFORT = 'COMFORT',
  LANDLORD_HONESTY = 'LANDLORD_HONESTY',
  PRICE_QUALITY = 'PRICE_QUALITY',
}

export interface User {
  id: string;
  email: string | null;
  name: string;
  avatar: string | null;
  role: UserRole;
  createdAt: string;
}

export interface Address {
  id: string;
  country: string;
  city: string;
  street: string;
  building: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Apartment {
  id: string;
  addressId: string;
  number: string;
  address: Address;
  reviewsCount?: number;
}

export interface Rating {
  id: string;
  criterion: RatingCriterion;
  score: number;
}

export interface Photo {
  id: string;
  url: string;
  fileName: string;
}

export interface Review {
  id: string;
  userId: string;
  apartmentId: string;
  comment: string;
  averageRating: number;
  periodFrom: string;
  periodTo: string;
  status: ReviewStatus;
  createdAt: string;
  publishedAt: string | null;
  rejectionReason?: string | null;
  user: User;
  apartment: Apartment;
  ratings: Rating[];
  photos: Photo[];
}

export interface CreateReviewDto {
  apartmentId: string;
  comment: string;
  periodFrom: string;
  periodTo: string;
  ratings: Array<{
    criterion: RatingCriterion;
    score: number;
  }>;
}

export interface AddressSearchResult {
  id: string;
  country: string;
  city: string;
  street: string;
  building: string;
  latitude: number | null;
  longitude: number | null;
  apartmentsCount: number;
  reviewsCount?: number;
  fromDatabase?: boolean;
  formattedAddress?: string;
}

export const RATING_CRITERIA_LABELS: Record<RatingCriterion, string> = {
  [RatingCriterion.TECHNICAL_CONDITION]: 'Техническое состояние и ремонт',
  [RatingCriterion.CLEANLINESS]: 'Чистота и гигиена',
  [RatingCriterion.SAFETY]: 'Безопасность района и дома',
  [RatingCriterion.COMFORT]: 'Комфорт проживания (шум, соседи)',
  [RatingCriterion.LANDLORD_HONESTY]: 'Честность и адекватность арендодателя',
  [RatingCriterion.PRICE_QUALITY]: 'Соотношение цены и качества',
};

