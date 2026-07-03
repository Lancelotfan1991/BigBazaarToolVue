import { useDataStore } from '@/stores/dataStore'
import { useFilterStore } from '@/stores/filterStore'

export function useSeason() {
  const dataStore = useDataStore()
  const filterStore = useFilterStore()

  async function switchSeason(val) {
    filterStore.showUpdatedOnly = false
    await dataStore.switchSeason(val)
  }

  return { season: dataStore.season, switchSeason }
}
