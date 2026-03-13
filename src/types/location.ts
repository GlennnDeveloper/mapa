export type LocationType = 'project' | 'storage' | 'suggestion';
export type LocationStatus = 'nuevo' | 'proceso' | 'terminado';

export interface Location {
  id: string;
  created_at: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: LocationType;
  status: LocationStatus;
  description?: string;
}

export type NewLocation = Omit<Location, 'id' | 'created_at'>;
