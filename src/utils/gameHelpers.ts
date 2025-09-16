import { BOARD_SPACES, BoardSpace, ColorGroup, PROPERTY_IDS_BY_COLOR } from '../data/board'

type OwnedSpaceState = {
  ownerId: number | null
  houses: number
}

export function createInitialOwnership(): Record<number, OwnedSpaceState> {
  const ownership: Record<number, OwnedSpaceState> = {}
  for (const space of BOARD_SPACES) {
    if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
      ownership[space.id] = { ownerId: null, houses: 0 }
    }
  }
  return ownership
}

export function shuffle<T>(items: T[]): T[] {
  const array = [...items]
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export function hasMonopoly(ownerId: number, color: ColorGroup, ownership: Record<number, OwnedSpaceState>): boolean {
  const propertyIds = PROPERTY_IDS_BY_COLOR[color]
  if (!propertyIds.length) return false
  return propertyIds.every((id) => ownership[id]?.ownerId === ownerId)
}

function countOwnedSpaces(ownerId: number, predicate: (space: BoardSpace) => boolean, ownership: Record<number, OwnedSpaceState>): number {
  return BOARD_SPACES.filter(predicate).reduce((acc, space) => {
    if (ownership[space.id]?.ownerId === ownerId) {
      return acc + 1
    }
    return acc
  }, 0)
}

export function countOwnedRailroads(ownerId: number, ownership: Record<number, OwnedSpaceState>): number {
  return countOwnedSpaces(ownerId, (space) => space.type === 'railroad', ownership)
}

export function countOwnedUtilities(ownerId: number, ownership: Record<number, OwnedSpaceState>): number {
  return countOwnedSpaces(ownerId, (space) => space.type === 'utility', ownership)
}

export function calculateRent(
  space: BoardSpace,
  ownership: Record<number, OwnedSpaceState>,
  ownerId: number,
  options: { diceTotal?: number; rentMultiplier?: number; forcedUtilityMultiplier?: number } = {}
): number {
  const rentMultiplier = options.rentMultiplier ?? 1
  if (space.type === 'property') {
    const state = ownership[space.id]
    const houses = state?.houses ?? 0
    const propertyRent = space.rent[Math.min(houses, space.rent.length - 1)]
    if (houses === 0 && hasMonopoly(ownerId, space.color, ownership)) {
      return propertyRent * 2 * rentMultiplier
    }
    return propertyRent * rentMultiplier
  }
  if (space.type === 'railroad') {
    const ownedCount = countOwnedRailroads(ownerId, ownership)
    const index = Math.min(Math.max(ownedCount - 1, 0), space.rent.length - 1)
    return space.rent[index] * rentMultiplier
  }
  if (space.type === 'utility') {
    const diceTotal = options.diceTotal ?? 0
    const ownedCount = countOwnedUtilities(ownerId, ownership)
    const multiplier = options.forcedUtilityMultiplier ?? (ownedCount === 2 ? 10 : 4)
    return diceTotal * multiplier * rentMultiplier
  }
  return 0
}

export function formatCurrency(amount: number): string {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  return formatter.format(amount)
}

export type { OwnedSpaceState }
