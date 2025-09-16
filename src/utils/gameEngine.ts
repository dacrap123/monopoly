import { BOARD_SPACES, BoardSpace, PropertySpace } from '../data/board'
import { Card, CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from '../data/cards'
import {
  OwnedSpaceState,
  calculateRent,
  createInitialOwnership,
  formatCurrency,
  hasMonopoly,
  shuffle,
} from './gameHelpers'

export interface Player {
  id: number
  name: string
  color: string
  position: number
  money: number
  inJail: boolean
  jailTurns: number
  getOutOfJail: {
    chance: boolean
    community: boolean
  }
  bankrupt: boolean
}

export interface DiceState {
  values: [number, number]
  total: number
  isDouble: boolean
}

export interface RentContext {
  rentMultiplier?: number
  forcedUtilityMultiplier?: number
  diceTotal?: number
}

export interface PendingAction {
  type: 'purchase'
  spaceId: number
  rentContext?: RentContext
}

export interface PendingDebt {
  playerId: number
  amount: number
  owedTo: number | null
  description: string
  allowBankruptcy: boolean
  afterPayment?: { type: 'move-from-jail'; steps: number; diceTotal: number } | null
}

export interface ActiveCard {
  deck: 'chance' | 'community'
  card: Card
}

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  ownership: Record<number, OwnedSpaceState>
  decks: {
    chance: Card[]
    community: Card[]
  }
  heldGetOutOfJail: {
    chance: number | null
    community: number | null
  }
  dice: DiceState | null
  pendingAction: PendingAction | null
  pendingDebt: PendingDebt | null
  activeCard: ActiveCard | null
  logs: string[]
  consecutiveDoubles: number
  extraRollAvailable: boolean
  canRoll: boolean
  canEndTurn: boolean
  winnerId: number | null
}

export type GameAction =
  | { type: 'ROLL'; values: [number, number] }
  | { type: 'RESOLVE_PURCHASE'; spaceId: number; buy: boolean }
  | { type: 'END_TURN' }
  | { type: 'BUILD'; spaceId: number }
  | { type: 'SELL'; spaceId: number }
  | { type: 'RESOLVE_DEBT' }
  | { type: 'DECLARE_BANKRUPTCY' }
  | { type: 'USE_GET_OUT_OF_JAIL_CARD'; deck: 'chance' | 'community' }
  | { type: 'PAY_BAIL' }

function cloneState(state: GameState): GameState {
  if (typeof structuredClone === 'function') {
    return structuredClone(state)
  }
  return JSON.parse(JSON.stringify(state)) as GameState
}

function addLog(state: GameState, message: string) {
  state.logs = [message, ...state.logs].slice(0, 120)
}

function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex]
}

function findNextActivePlayer(state: GameState, startIndex: number): number {
  const total = state.players.length
  let index = startIndex
  for (let i = 0; i < total; i += 1) {
    index = (index + 1) % total
    if (!state.players[index].bankrupt) {
      return index
    }
  }
  return startIndex
}

function advanceToNextPlayer(state: GameState) {
  const nextIndex = findNextActivePlayer(state, state.currentPlayerIndex)
  state.currentPlayerIndex = nextIndex
  state.consecutiveDoubles = 0
  state.extraRollAvailable = false
  state.canRoll = true
  state.canEndTurn = false
  state.dice = null
  state.pendingAction = null
  state.activeCard = null
}

function countActivePlayers(state: GameState): number {
  return state.players.filter((player) => !player.bankrupt).length
}

function checkForWinner(state: GameState) {
  if (!state.winnerId && countActivePlayers(state) === 1) {
    const winner = state.players.find((player) => !player.bankrupt)
    if (winner) {
      state.winnerId = winner.id
      state.canRoll = false
      state.canEndTurn = false
      addLog(state, `${winner.name} wins the game!`)
    }
  }
}

function credit(state: GameState, playerId: number, amount: number) {
  const player = state.players.find((p) => p.id === playerId)
  if (player) {
    player.money += amount
  }
}

function attemptPayment(
  state: GameState,
  payerId: number,
  amount: number,
  owedTo: number | null,
  description: string,
  options: { allowDebt: boolean; rentContext?: RentContext; afterPayment?: PendingDebt['afterPayment'] | null } = { allowDebt: false }
): boolean {
  const payer = state.players.find((player) => player.id === payerId)
  if (!payer || payer.bankrupt) return true
  if (amount <= 0) return true
  if (payer.money >= amount) {
    payer.money -= amount
    if (owedTo !== null) {
      credit(state, owedTo, amount)
    }
    addLog(state, `${payer.name} paid ${formatCurrency(amount)}${owedTo !== null ? ` to ${state.players.find((p) => p.id === owedTo)?.name ?? 'another player'}` : ''}.`)
    if (options.afterPayment) {
      state.pendingDebt = null
      executeAfterPayment(state, payer, options.afterPayment, options.rentContext ?? undefined)
    }
    return true
  }

  if (options.allowDebt) {
    state.pendingDebt = {
      playerId: payerId,
      amount,
      owedTo,
      description,
      allowBankruptcy: true,
      afterPayment: options.afterPayment ?? null,
    }
    addLog(state, `${payer.name} needs ${formatCurrency(amount)} to ${description}.`)
    state.canRoll = false
    state.canEndTurn = false
    return false
  }

  declareBankruptcy(state, payerId, owedTo)
  return false
}

function executeAfterPayment(state: GameState, player: Player, after: NonNullable<PendingDebt['afterPayment']>, rentContext?: RentContext) {
  if (after.type === 'move-from-jail') {
    movePlayer(state, player, after.steps, { diceTotal: after.diceTotal, ...rentContext })
  }
}

function movePlayer(state: GameState, player: Player, steps: number, rentContext: RentContext = {}) {
  const start = player.position
  const boardSize = BOARD_SPACES.length
  let newPosition = (player.position + steps) % boardSize
  if (newPosition < 0) {
    newPosition += boardSize
  }
  const passedGo = steps >= 0 && newPosition < start
  player.position = newPosition
  if (passedGo) {
    player.money += 200
    addLog(state, `${player.name} collected ${formatCurrency(200)} for passing GO.`)
  }
  resolveLanding(state, player, rentContext)
}

function goDirectlyToJail(state: GameState, player: Player) {
  player.position = 10
  player.inJail = true
  player.jailTurns = 0
  state.consecutiveDoubles = 0
  state.extraRollAvailable = false
  state.canRoll = false
  state.canEndTurn = true
  state.pendingAction = null
  addLog(state, `${player.name} was sent to Jail.`)
}

function replenishDeck(state: GameState, deck: 'chance' | 'community') {
  const base = deck === 'chance' ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS
  const held = deck === 'chance' ? state.heldGetOutOfJail.chance : state.heldGetOutOfJail.community
  const available = base.filter((card) => card.kind !== 'get-out-of-jail' || held === null)
  const shuffled = shuffle(available)
  if (deck === 'chance') {
    state.decks.chance = [...shuffled]
  } else {
    state.decks.community = [...shuffled]
  }
}

function returnGetOutOfJailCard(state: GameState, deck: 'chance' | 'community') {
  const card = (deck === 'chance' ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS).find((c) => c.kind === 'get-out-of-jail')
  if (!card) return
  const targetDeck = deck === 'chance' ? state.decks.chance : state.decks.community
  if (targetDeck.some((existing) => existing.id === card.id)) {
    return
  }
  if (deck === 'chance') {
    state.decks.chance = [...state.decks.chance, card]
  } else {
    state.decks.community = [...state.decks.community, card]
  }
}

function rollUtilityRent(): number {
  const die1 = Math.floor(Math.random() * 6) + 1
  const die2 = Math.floor(Math.random() * 6) + 1
  return die1 + die2
}

function findNearestOfType(start: number, type: 'railroad' | 'utility'): number {
  for (let offset = 1; offset < BOARD_SPACES.length; offset += 1) {
    const index = (start + offset) % BOARD_SPACES.length
    const space = BOARD_SPACES[index]
    if (space.type === type) {
      return index
    }
  }
  return start
}

function calculatePropertyRepairCost(state: GameState, player: Player, perHouse: number, perHotel: number): number {
  let cost = 0
  for (const [spaceId, owned] of Object.entries(state.ownership)) {
    if (owned.ownerId === player.id) {
      const space = BOARD_SPACES[Number(spaceId)]
      if (space.type === 'property') {
        if (owned.houses === 5) {
          cost += perHotel
        } else if (owned.houses > 0) {
          cost += owned.houses * perHouse
        }
      }
    }
  }
  return cost
}

function drawCard(state: GameState, deck: 'chance' | 'community', player: Player) {
  const deckState = deck === 'chance' ? state.decks.chance : state.decks.community
  if (deckState.length === 0) {
    replenishDeck(state, deck)
  }
  const currentDeck = deck === 'chance' ? state.decks.chance : state.decks.community
  const [card, ...rest] = currentDeck
  state.activeCard = { deck, card }
  if (deck === 'chance') {
    state.decks.chance = rest
  } else {
    state.decks.community = rest
  }
  applyCard(state, card, deck, player)
  if (card.kind !== 'get-out-of-jail') {
    if (deck === 'chance') {
      state.decks.chance = [...state.decks.chance, card]
    } else {
      state.decks.community = [...state.decks.community, card]
    }
  }
}

function applyCard(state: GameState, card: Card, deck: 'chance' | 'community', player: Player) {
  addLog(state, `${player.name} drew a card: ${card.description}`)
  switch (card.kind) {
    case 'advance-to-go':
      player.position = 0
      player.money += 200
      resolveLanding(state, player, { diceTotal: 0 })
      break
    case 'collect':
      player.money += card.amount
      addLog(state, `${player.name} received ${formatCurrency(card.amount)}.`)
      finalizePostAction(state)
      break
    case 'pay':
      attemptPayment(state, player.id, card.amount, null, card.description, { allowDebt: true })
      if (!state.pendingDebt) finalizePostAction(state)
      break
    case 'advance': {
      const start = player.position
      player.position = card.position
      if (card.passGo && card.position < start) {
        player.money += 200
        addLog(state, `${player.name} collected ${formatCurrency(200)} for passing GO.`)
      }
      resolveLanding(state, player, { diceTotal: state.dice?.total ?? 0 })
      break
    }
    case 'move-spaces':
      movePlayer(state, player, card.spaces, { diceTotal: state.dice?.total ?? 0 })
      break
    case 'advance-nearest-utility': {
      const target = findNearestOfType(player.position, 'utility')
      const passedGo = target < player.position
      player.position = target
      if (passedGo) {
        // no GO payout
      }
      const rentRoll = rollUtilityRent()
      addLog(state, `${player.name} rolled ${rentRoll} for utility rent.`)
      resolveLanding(state, player, { forcedUtilityMultiplier: 10, diceTotal: rentRoll })
      break
    }
    case 'advance-nearest-railroad': {
      const target = findNearestOfType(player.position, 'railroad')
      const passedGo = target < player.position
      player.position = target
      if (passedGo) {
        // no GO payout
      }
      resolveLanding(state, player, { rentMultiplier: 2, diceTotal: state.dice?.total ?? 0 })
      break
    }
    case 'go-to-jail':
      goDirectlyToJail(state, player)
      break
    case 'collect-each-player': {
      state.players.forEach((other) => {
        if (other.id !== player.id && !other.bankrupt) {
          const paid = attemptPayment(state, other.id, card.amount, player.id, card.description)
          if (!paid) {
            addLog(state, `${other.name} could not pay and went bankrupt.`)
          }
        }
      })
      finalizePostAction(state)
      break
    }
    case 'pay-each-player': {
      state.players.forEach((other) => {
        if (other.id !== player.id && !other.bankrupt) {
          attemptPayment(state, player.id, card.amount, other.id, card.description, { allowDebt: true })
        }
      })
      if (!state.pendingDebt) finalizePostAction(state)
      break
    }
    case 'property-expense': {
      const cost = calculatePropertyRepairCost(state, player, card.perHouse, card.perHotel)
      if (cost > 0) {
        attemptPayment(state, player.id, cost, null, card.description, { allowDebt: true })
        if (!state.pendingDebt) finalizePostAction(state)
      } else {
        finalizePostAction(state)
      }
      break
    }
    case 'property-collect': {
      const gain = calculatePropertyRepairCost(state, player, card.perHouse, card.perHotel)
      if (gain > 0) {
        player.money += gain
        addLog(state, `${player.name} collected ${formatCurrency(gain)} from the bank.`)
      }
      finalizePostAction(state)
      break
    }
    case 'get-out-of-jail':
      if (deck === 'chance') {
        state.heldGetOutOfJail.chance = player.id
        player.getOutOfJail.chance = true
      } else {
        state.heldGetOutOfJail.community = player.id
        player.getOutOfJail.community = true
      }
      finalizePostAction(state)
      break
    default:
      finalizePostAction(state)
  }
}

function resolveLanding(state: GameState, player: Player, rentContext: RentContext = {}) {
  const space = BOARD_SPACES[player.position]
  switch (space.type) {
    case 'go':
      addLog(state, `${player.name} landed on GO.`)
      finalizePostAction(state)
      break
    case 'free-parking':
      addLog(state, `${player.name} is taking a break at Free Parking.`)
      finalizePostAction(state)
      break
    case 'jail':
      addLog(state, `${player.name} is just visiting Jail.`)
      finalizePostAction(state)
      break
    case 'go-to-jail':
      goDirectlyToJail(state, player)
      break
    case 'tax':
      attemptPayment(state, player.id, space.amount, null, `pay ${space.name}`, { allowDebt: true })
      if (!state.pendingDebt) {
        finalizePostAction(state)
      }
      break
    case 'chance':
      drawCard(state, 'chance', player)
      break
    case 'community-chest':
      drawCard(state, 'community', player)
      break
    case 'property':
    case 'railroad':
    case 'utility':
      handleOwnableLanding(state, player, space, rentContext)
      break
    default:
      finalizePostAction(state)
  }
}

function handleOwnableLanding(state: GameState, player: Player, space: BoardSpace, rentContext: RentContext) {
  const owned = state.ownership[space.id]
  if (!owned || owned.ownerId === null) {
    let cost = 0
    if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
      cost = space.cost
    }
    addLog(state, `${player.name} can purchase ${space.name} for ${formatCurrency(cost)}.`)
    state.pendingAction = { type: 'purchase', spaceId: space.id, rentContext }
    state.canEndTurn = false
    state.canRoll = false
    return
  }

  if (owned.ownerId === player.id) {
    addLog(state, `${player.name} landed on their own property.`)
    finalizePostAction(state)
    return
  }

  const owner = state.players.find((p) => p.id === owned.ownerId)
  if (!owner || owner.bankrupt) {
    owned.ownerId = null
    state.pendingAction = { type: 'purchase', spaceId: space.id, rentContext }
    return
  }

  const diceTotal = rentContext.diceTotal ?? state.dice?.total ?? 0
  const rent = calculateRent(space, state.ownership, owner.id, {
    diceTotal,
    rentMultiplier: rentContext.rentMultiplier,
    forcedUtilityMultiplier: rentContext.forcedUtilityMultiplier,
  })
  if (rent <= 0) {
    finalizePostAction(state)
    return
  }
  addLog(state, `${player.name} owes ${formatCurrency(rent)} to ${owner.name}.`)
  const paid = attemptPayment(state, player.id, rent, owner.id, `pay rent for ${space.name}`, {
    allowDebt: true,
  })
  if (paid) {
    finalizePostAction(state)
  }
}

function finalizePostAction(state: GameState) {
  if (state.pendingDebt) {
    return
  }
  state.pendingAction = null
  if (state.extraRollAvailable) {
    state.canRoll = true
    state.canEndTurn = false
  } else {
    state.canRoll = false
    state.canEndTurn = true
  }
}

function declareBankruptcy(state: GameState, playerId: number, owedTo: number | null) {
  const playerIndex = state.players.findIndex((p) => p.id === playerId)
  if (playerIndex === -1) return
  const player = state.players[playerIndex]
  if (player.bankrupt) return
  player.bankrupt = true
  player.money = 0
  addLog(state, `${player.name} declared bankruptcy.`)
  for (const [spaceId, owned] of Object.entries(state.ownership)) {
    if (owned.ownerId === player.id) {
      if (owedTo !== null) {
        owned.ownerId = owedTo
      } else {
        owned.ownerId = null
        owned.houses = 0
      }
    }
  }
  if (state.heldGetOutOfJail.chance === player.id) {
    state.heldGetOutOfJail.chance = null
    returnGetOutOfJailCard(state, 'chance')
  }
  if (state.heldGetOutOfJail.community === player.id) {
    state.heldGetOutOfJail.community = null
    returnGetOutOfJailCard(state, 'community')
  }
  if (state.pendingDebt && state.pendingDebt.playerId === player.id) {
    state.pendingDebt = null
  }
  if (state.currentPlayerIndex === playerIndex) {
    advanceToNextPlayer(state)
  }
  checkForWinner(state)
}

function getGroupPropertyIds(color: PropertySpace['color']): number[] {
  return BOARD_SPACES.filter((space) => space.type === 'property' && space.color === color).map((space) => space.id)
}

function canBuildOn(state: GameState, playerId: number, spaceId: number): boolean {
  const space = BOARD_SPACES[spaceId]
  if (space.type !== 'property') return false
  const owned = state.ownership[spaceId]
  if (!owned || owned.ownerId !== playerId) return false
  if (owned.houses >= 5) return false
  const groupIds = getGroupPropertyIds(space.color)
  if (!groupIds.every((id) => state.ownership[id]?.ownerId === playerId)) return false
  const houseCounts = groupIds.map((id) => state.ownership[id].houses)
  const min = Math.min(...houseCounts)
  return owned.houses === min
}

function canSellOn(state: GameState, playerId: number, spaceId: number): boolean {
  const space = BOARD_SPACES[spaceId]
  if (space.type !== 'property') return false
  const owned = state.ownership[spaceId]
  if (!owned || owned.ownerId !== playerId) return false
  if (owned.houses <= 0) return false
  const groupIds = getGroupPropertyIds(space.color)
  const houseCounts = groupIds.map((id) => state.ownership[id].houses)
  const max = Math.max(...houseCounts)
  return owned.houses === max
}

function buildHouse(state: GameState, player: Player, spaceId: number) {
  const space = BOARD_SPACES[spaceId]
  if (space.type !== 'property') return
  const owned = state.ownership[spaceId]
  if (!owned || owned.ownerId !== player.id) return
  if (!canBuildOn(state, player.id, spaceId)) return
  if (player.money < space.houseCost) return
  player.money -= space.houseCost
  owned.houses += 1
  const descriptor = owned.houses === 5 ? 'a hotel' : `house #${owned.houses}`
  addLog(state, `${player.name} built ${descriptor} on ${space.name}.`)
}

function sellHouse(state: GameState, player: Player, spaceId: number) {
  const space = BOARD_SPACES[spaceId]
  if (space.type !== 'property') return
  const owned = state.ownership[spaceId]
  if (!owned || owned.ownerId !== player.id) return
  if (!canSellOn(state, player.id, spaceId)) return
  if (owned.houses <= 0) return
  const wasHotel = owned.houses === 5
  owned.houses -= 1
  const value = Math.floor(space.houseCost / 2)
  player.money += value
  addLog(state, `${player.name} sold a ${wasHotel ? 'hotel' : 'house'} on ${space.name} for ${formatCurrency(value)}.`)
}

function handleRoll(state: GameState, values: [number, number]) {
  if (!state.canRoll || state.pendingDebt || state.pendingAction || state.winnerId) {
    return
  }
  const [die1, die2] = values
  const total = die1 + die2
  const isDouble = die1 === die2
  state.dice = { values, total, isDouble }
  state.canRoll = false
  const player = getCurrentPlayer(state)
  addLog(state, `${player.name} rolled ${die1} and ${die2}.`)

  if (player.inJail) {
    state.extraRollAvailable = false
    if (isDouble) {
      addLog(state, `${player.name} rolled doubles to leave Jail.`)
      player.inJail = false
      player.jailTurns = 0
      state.extraRollAvailable = false
      state.consecutiveDoubles = 0
      movePlayer(state, player, total, { diceTotal: total })
    } else {
      player.jailTurns += 1
      if (player.jailTurns >= 3) {
        addLog(state, `${player.name} must pay $50 bail after three failed attempts.`)
        const paid = attemptPayment(
          state,
          player.id,
          50,
          null,
          'pay bail',
          { allowDebt: true, afterPayment: { type: 'move-from-jail', steps: total, diceTotal: total } }
        )
        if (!paid) {
          // waiting for payment before moving
        }
      } else {
        addLog(state, `${player.name} remains in Jail.`)
        state.canEndTurn = true
        state.extraRollAvailable = false
      }
    }
    return
  }

  if (isDouble) {
    state.consecutiveDoubles += 1
  } else {
    state.consecutiveDoubles = 0
  }

  if (isDouble && state.consecutiveDoubles >= 3) {
    addLog(state, `${player.name} rolled three doubles in a row and is sent to Jail.`)
    goDirectlyToJail(state, player)
    return
  }

  state.extraRollAvailable = isDouble
  movePlayer(state, player, total, { diceTotal: total })
}

function handlePurchase(state: GameState, spaceId: number, buy: boolean) {
  const player = getCurrentPlayer(state)
  const space = BOARD_SPACES[spaceId]
  if (!state.pendingAction || state.pendingAction.spaceId !== spaceId) return
  if (!buy) {
    addLog(state, `${player.name} declined to buy ${space.name}.`)
    state.pendingAction = null
    finalizePostAction(state)
    return
  }
  const cost = space.type === 'property' || space.type === 'railroad' || space.type === 'utility' ? space.cost : 0
  if (player.money < cost) {
    addLog(state, `${player.name} cannot afford ${space.name}.`)
    finalizePostAction(state)
    return
  }
  player.money -= cost
  state.ownership[spaceId] = state.ownership[spaceId] ?? { ownerId: null, houses: 0 }
  state.ownership[spaceId].ownerId = player.id
  addLog(state, `${player.name} purchased ${space.name} for ${formatCurrency(cost)}.`)
  state.pendingAction = null
  finalizePostAction(state)
}

function resolveDebt(state: GameState) {
  if (!state.pendingDebt) return
  const pending = state.pendingDebt
  const player = state.players.find((p) => p.id === pending.playerId)
  if (!player || player.bankrupt) {
    state.pendingDebt = null
    return
  }
  if (player.money < pending.amount) {
    addLog(state, `${player.name} still needs ${formatCurrency(pending.amount)} to ${pending.description}.`)
    return
  }
  player.money -= pending.amount
  if (pending.owedTo !== null) {
    credit(state, pending.owedTo, pending.amount)
  }
  addLog(state, `${player.name} paid ${formatCurrency(pending.amount)} to ${pending.owedTo !== null ? state.players.find((p) => p.id === pending.owedTo)?.name ?? 'another player' : 'the bank'}.`)
  const after = pending.afterPayment
  state.pendingDebt = null
  if (after) {
    executeAfterPayment(state, player, after)
  } else {
    finalizePostAction(state)
  }
}

function useGetOutOfJailCard(state: GameState, deck: 'chance' | 'community') {
  const player = getCurrentPlayer(state)
  if (!player.inJail) return
  if (!player.getOutOfJail[deck]) return
  player.getOutOfJail[deck] = false
  if (deck === 'chance') {
    state.heldGetOutOfJail.chance = null
  } else {
    state.heldGetOutOfJail.community = null
  }
  returnGetOutOfJailCard(state, deck)
  player.inJail = false
  player.jailTurns = 0
  addLog(state, `${player.name} used a Get Out of Jail Free card.`)
  state.canRoll = true
  state.canEndTurn = false
  state.extraRollAvailable = false
}

function payBail(state: GameState) {
  const player = getCurrentPlayer(state)
  if (!player.inJail) return
  if (player.money < 50) {
    addLog(state, `${player.name} does not have enough cash to pay bail.`)
    return
  }
  player.money -= 50
  addLog(state, `${player.name} paid ${formatCurrency(50)} for bail.`)
  player.inJail = false
  player.jailTurns = 0
  state.canRoll = true
  state.canEndTurn = false
  state.extraRollAvailable = false
}

function handleEndTurn(state: GameState) {
  if (!state.canEndTurn || state.pendingDebt || state.pendingAction) {
    return
  }
  advanceToNextPlayer(state)
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const next = cloneState(state)
  switch (action.type) {
    case 'ROLL':
      handleRoll(next, action.values)
      break
    case 'RESOLVE_PURCHASE':
      handlePurchase(next, action.spaceId, action.buy)
      break
    case 'END_TURN':
      handleEndTurn(next)
      break
    case 'BUILD': {
      const player = getCurrentPlayer(next)
      buildHouse(next, player, action.spaceId)
      break
    }
    case 'SELL': {
      const player = getCurrentPlayer(next)
      sellHouse(next, player, action.spaceId)
      break
    }
    case 'RESOLVE_DEBT':
      resolveDebt(next)
      break
    case 'DECLARE_BANKRUPTCY': {
      const player = getCurrentPlayer(next)
      declareBankruptcy(next, player.id, next.pendingDebt?.owedTo ?? null)
      break
    }
    case 'USE_GET_OUT_OF_JAIL_CARD':
      useGetOutOfJailCard(next, action.deck)
      break
    case 'PAY_BAIL':
      payBail(next)
      break
    default:
      break
  }
  checkForWinner(next)
  return next
}

function createPlayer(id: number, name: string, color: string): Player {
  return {
    id,
    name,
    color,
    position: 0,
    money: 1500,
    inJail: false,
    jailTurns: 0,
    getOutOfJail: { chance: false, community: false },
    bankrupt: false,
  }
}

export function createInitialState(): GameState {
  return {
    players: [
      createPlayer(0, 'Dog', '#ef4444'),
      createPlayer(1, 'Car', '#3b82f6'),
      createPlayer(2, 'Hat', '#22c55e'),
      createPlayer(3, 'Ship', '#f59e0b'),
    ],
    currentPlayerIndex: 0,
    ownership: createInitialOwnership(),
    decks: {
      chance: shuffle(CHANCE_CARDS),
      community: shuffle(COMMUNITY_CHEST_CARDS),
    },
    heldGetOutOfJail: {
      chance: null,
      community: null,
    },
    dice: null,
    pendingAction: null,
    pendingDebt: null,
    activeCard: null,
    logs: ['Welcome to Monopoly!'],
    consecutiveDoubles: 0,
    extraRollAvailable: false,
    canRoll: true,
    canEndTurn: false,
    winnerId: null,
  }
}

export function canBuild(state: GameState, playerId: number, spaceId: number): boolean {
  return canBuildOn(state, playerId, spaceId)
}

export function canSell(state: GameState, playerId: number, spaceId: number): boolean {
  return canSellOn(state, playerId, spaceId)
}

