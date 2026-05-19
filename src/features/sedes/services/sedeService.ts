import api from '../../../config/api'
import type { Sede } from '../../../types'

const sedeService = {
  getAll: () => api.get<Sede[]>('/locations').then((r) => r.data),
  getById: (id: string) => api.get<Sede>(`/locations/${id}`).then((r) => r.data),
  create: (data: Partial<Sede>) => api.post<Sede>('/locations', data).then((r) => r.data),
  update: (id: string, data: Partial<Sede>) => api.put<Sede>(`/locations/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/locations/${id}`),
}

export default sedeService

const GOOGLE_MAPS_API_KEY = 'AIzaSyAI4wxGabETICPQ6rmWft48nCg3i09efcY'

export interface PlaceSuggestion {
  description: string
  place_id: string
}

export interface PlaceDetails {
  direccion: string
  latitude: number
  longitude: number
}

export const googleMapsService = {
  async buscarSugerencias(
    query: string,
    center: { lat: number; lng: number } = { lat: -12.0464, lng: -77.0428 },
  ): Promise<PlaceSuggestion[]> {
    if (!query || query.trim().length < 3) return []
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'suggestions.placePrediction.place,suggestions.placePrediction.text',
      },
      body: JSON.stringify({
        input: query,
        locationBias: { circle: { center: { latitude: center.lat, longitude: center.lng }, radius: 20000 } },
        languageCode: 'es',
      }),
    })
    const data = await res.json()
    if (!res.ok || !data.suggestions) return []
    return data.suggestions
      .filter((s: any) => s.placePrediction)
      .map((s: any) => ({
        description: s.placePrediction.text.text,
        place_id: s.placePrediction.place.replace('places/', ''),
      }))
  },

  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'formattedAddress,location',
      },
    })
    const place = await res.json()
    if (!res.ok || !place.location) throw new Error('No se obtuvieron detalles del lugar')
    return {
      direccion: place.formattedAddress ?? '',
      latitude: place.location.latitude,
      longitude: place.location.longitude,
    }
  },
}
