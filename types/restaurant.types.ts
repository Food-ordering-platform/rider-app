export interface Restaurant {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  imageUrl?: string;
  prepTime: number;
  isOpen: boolean;
  ownerId: string;
  minimumOrder: number;
  latitude?: number | null;
  longitude?: number | null;
}