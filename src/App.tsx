import React, { useMemo, useReducer, useState } from 'react'
import Board from './components/Board'
import { BOARD_SPACES, PROPERTY_IDS_BY_COLOR, PropertySpace, ColorGroup, COLOR_GROUP_DISPLAY } from './data/board'
import { formatCurrency } from './utils/gameHelpers'
import { canBuild, canSell, createInitialState, gameReducer } from './utils/gameEngine'

const App: React.FC = () => {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const currentPlayer = state.players[state.currentPlayerIndex]
  const winner = state.winnerId != null ? state.players.find((player) => player.id === state.winnerId) : undefined
  const pendingAction = state.pendingAction
  const pendingDebt = state.pendingDebt && state.players[state.pendingDebt.playerId]?.bankrupt ? null : state.pendingDebt

  const [isPropertyPanelMinimized, setPropertyPanelMinimized] = useState(false)

  const monopolies = useMemo(() => {
    return Object.entries(PROPERTY_IDS_BY_COLOR)
      .filter(([_, ids]) => ids.every((id) => state.ownership[id]?.ownerId === currentPlayer.id))
      .map(([color, ids]) => ({ color, ids }))
  }, [state.ownership, currentPlayer.id])

  const ownedProperties = useMemo(() => {
    return BOARD_SPACES.filter(
      (space): space is PropertySpace => space.type === 'property' && state.ownership[space.id]?.ownerId === currentPlayer.id
    )
  }, [state.ownership, currentPlayer.id])

  const propertyControlList = useMemo(() => {
    const monopolyIds = new Set(monopolies.flatMap((group) => group.ids))
    return ownedProperties.filter((space) => monopolyIds.has(space.id) || (state.ownership[space.id]?.houses ?? 0) > 0)
  }, [monopolies, ownedProperties, state.ownership])

  const propertyHandGroups = useMemo(() => {
    const grouped = new Map<ColorGroup, PropertySpace[]>()

    for (const property of ownedProperties) {
      const existing = grouped.get(property.color)
      if (existing) {
        existing.push(property)
      } else {
        grouped.set(property.color, [property])
      }
    }

    return (Object.keys(PROPERTY_IDS_BY_COLOR) as ColorGroup[])
      .map((color) => {
        const properties = grouped.get(color) ?? []
        if (properties.length === 0) {
          return null
        }
        const orderedIds = PROPERTY_IDS_BY_COLOR[color]
        const sorted = [...properties].sort(
          (a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
        )
        return { color, properties: sorted }
      })
      .filter(Boolean) as { color: ColorGroup; properties: PropertySpace[] }[]
  }, [ownedProperties])

  const dice = state.dice

  const handleRoll = () => {
    if (!state.canRoll || winner) return
    const die1 = Math.floor(Math.random() * 6) + 1
    const die2 = Math.floor(Math.random() * 6) + 1
    dispatch({ type: 'ROLL', values: [die1, die2] })
  }

  const handlePurchase = (buy: boolean) => {
    if (!pendingAction) return
    dispatch({ type: 'RESOLVE_PURCHASE', spaceId: pendingAction.spaceId, buy })
  }

  const handleEndTurn = () => {
    dispatch({ type: 'END_TURN' })
  }

  const handleResolveDebt = () => {
    dispatch({ type: 'RESOLVE_DEBT' })
  }

  const handleDeclareBankruptcy = () => {
    dispatch({ type: 'DECLARE_BANKRUPTCY' })
  }

  const handleBuild = (spaceId: number) => {
    dispatch({ type: 'BUILD', spaceId })
  }

  const handleSell = (spaceId: number) => {
    dispatch({ type: 'SELL', spaceId })
  }

  const handlePayBail = () => {
    dispatch({ type: 'PAY_BAIL' })
  }

  const handleUseCard = (deck: 'chance' | 'community') => {
    dispatch({ type: 'USE_GET_OUT_OF_JAIL_CARD', deck })
  }

  const propertyPanelToggleAriaLabel = isPropertyPanelMinimized ? 'Show property cards' : 'Hide property cards'
  const propertyPanelToggleText = isPropertyPanelMinimized ? 'Show cards' : 'Hide cards'

  return (
    <div className={`relative min-h-screen bg-neutral-100 ${isPropertyPanelMinimized ? 'pb-24' : 'pb-56'}`}>
      <header className="border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-3xl font-black uppercase tracking-widest text-neutral-800">Monopoly</h1>
          <div className="text-sm text-neutral-500">Mouse-friendly 4-player edition</div>
        </div>
      </header>
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
        {winner && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-700 shadow">
            {winner.name} has won the game!
          </div>
        )}
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <Board ownership={state.ownership} players={state.players} currentPlayerId={currentPlayer.id} />
          </div>
          <aside className="w-full max-w-xl space-y-4">
            <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">{currentPlayer.name}</h2>
                  <p className="text-sm text-neutral-500">{formatCurrency(currentPlayer.money)}</p>
                  <p className="text-xs uppercase tracking-wide text-neutral-400">
                    {currentPlayer.inJail ? 'In Jail' : 'Ready to move'}
                  </p>
                </div>
                {dice && (
                  <div className="flex items-center gap-2">
                    {dice.values.map((value, index) => (
                      <div
                        key={index}
                        className="flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-300 bg-neutral-50 text-xl font-bold"
                      >
                        {value}
                      </div>
                    ))}
                  </div>
                )}
              </header>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRoll}
                  disabled={!state.canRoll || Boolean(pendingDebt) || Boolean(pendingAction) || Boolean(winner)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-blue-200"
                >
                  Roll Dice
                </button>
                <button
                  type="button"
                  onClick={handleEndTurn}
                  disabled={!state.canEndTurn || Boolean(winner)}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  End Turn
                </button>
                {currentPlayer.inJail && (
                  <>
                    <button
                      type="button"
                      onClick={handlePayBail}
                      className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-amber-200"
                      disabled={currentPlayer.money < 50}
                    >
                      Pay $50 Bail
                    </button>
                    {currentPlayer.getOutOfJail.chance && (
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow"
                        onClick={() => handleUseCard('chance')}
                      >
                        Use Chance Card
                      </button>
                    )}
                    {currentPlayer.getOutOfJail.community && (
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow"
                        onClick={() => handleUseCard('community')}
                      >
                        Use Community Card
                      </button>
                    )}
                  </>
                )}
              </div>
              {pendingAction && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  {(() => {
                    const space = BOARD_SPACES[pendingAction.spaceId]
                    let cost = 0
                    if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
                      cost = space.cost
                    }
                    return (
                      <p>
                        Purchase {space.name} for {formatCurrency(cost)}?
                      </p>
                    )
                  })()}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePurchase(true)}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePurchase(false)}
                      className="rounded-md bg-neutral-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}
              {pendingDebt && pendingDebt.playerId === currentPlayer.id && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <p>
                    You owe {formatCurrency(pendingDebt.amount)}{' '}
                    {pendingDebt.owedTo != null ? `to ${state.players[pendingDebt.owedTo].name}` : 'to the bank'} to {pendingDebt.description}.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleResolveDebt}
                      className="rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                    >
                      Pay Now
                    </button>
                    <button
                      type="button"
                      onClick={handleDeclareBankruptcy}
                      className="rounded-md bg-neutral-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-800"
                    >
                      Declare Bankruptcy
                    </button>
                  </div>
                </div>
              )}
              {state.activeCard && (
                <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800">
                  <p className="font-semibold">{state.activeCard.deck === 'chance' ? 'Chance' : 'Community Chest'}</p>
                  <p>{state.activeCard.card.description}</p>
                </div>
              )}
            </section>
            <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900">Investments</h3>
              {propertyControlList.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-500">Gain monopolies to build houses and hotels.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {propertyControlList.map((property) => {
                    const owned = state.ownership[property.id]
                    const canBuildHere = canBuild(state, currentPlayer.id, property.id) && currentPlayer.money >= property.houseCost
                    const canSellHere = canSell(state, currentPlayer.id, property.id)
                    const houseCount = owned?.houses ?? 0
                    const label =
                      houseCount === 0
                        ? 'No houses yet'
                        : houseCount === 5
                        ? 'Hotel'
                        : `${houseCount} House${houseCount === 1 ? '' : 's'}`
                    return (
                      <li key={property.id} className="rounded-lg border border-neutral-200 p-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-neutral-800">{property.name}</div>
                            <div className="text-xs text-neutral-500">
                              {label} · Build cost {formatCurrency(property.houseCost)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleBuild(property.id)}
                              disabled={!canBuildHere}
                              className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:bg-green-200"
                            >
                              Build
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSell(property.id)}
                              disabled={!canSellHere}
                              className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:bg-red-200"
                            >
                              Sell
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
            <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900">Players</h3>
              <ul className="mt-2 space-y-2">
                {state.players.map((player) => {
                  const position = BOARD_SPACES[player.position]
                  return (
                    <li
                      key={player.id}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        player.bankrupt ? 'border-neutral-200 bg-neutral-100 text-neutral-400' : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: player.color }} />
                          <span className="font-semibold text-neutral-900">{player.name}</span>
                          {player.inJail && !player.bankrupt && <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">Jail</span>}
                          {player.bankrupt && <span className="rounded bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-500">Bankrupt</span>}
                        </div>
                        <span className="font-semibold text-neutral-800">{formatCurrency(player.money)}</span>
                      </div>
                      {!player.bankrupt && (
                        <p className="mt-1 text-xs text-neutral-500">{position.name}</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
            <section className="max-h-64 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900">Activity Log</h3>
              <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                {state.logs.map((entry, index) => (
                  <li key={index} className="rounded bg-neutral-100 px-2 py-1">
                    {entry}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>
      <div
        className={`fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-200 bg-white/95 shadow-[0_-8px_16px_rgba(15,23,42,0.12)] backdrop-blur transition-transform duration-300 ${
          isPropertyPanelMinimized ? 'pointer-events-none translate-y-full' : 'translate-y-0'
        }`}
        aria-hidden={isPropertyPanelMinimized}
      >
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
                {currentPlayer.name}'s Properties
              </h3>
              <span className="text-xs text-neutral-400">Grouped by color</span>
            </div>
            <button
              type="button"
              onClick={() => setPropertyPanelMinimized((prev) => !prev)}
              aria-expanded={!isPropertyPanelMinimized}
              aria-controls="property-tray-content"
              aria-label={propertyPanelToggleAriaLabel}
              className="group inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 shadow-sm transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <span>{propertyPanelToggleText}</span>
              <svg
                className={`h-3 w-3 transition-transform ${isPropertyPanelMinimized ? '-rotate-90' : 'rotate-90'}`}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M6 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div
            id="property-tray-content"
            className={`overflow-hidden transition-[max-height] duration-300 ${
              isPropertyPanelMinimized ? 'mt-0 pointer-events-none' : 'mt-3 pointer-events-auto'
            }`}
            style={{ maxHeight: isPropertyPanelMinimized ? 0 : 400 }}
          >
            {propertyHandGroups.length === 0 ? (
              <p className="text-xs text-neutral-500">You don't own any colored properties yet.</p>
            ) : (
              <div className="flex flex-nowrap items-end gap-6 overflow-x-auto pb-3">
                {propertyHandGroups.map(({ color, properties }) => {
                  const colorInfo = COLOR_GROUP_DISPLAY[color]
                  const stackWidth = 128 + Math.max(properties.length - 1, 0) * 24
                  return (
                    <div key={color} className="flex flex-none flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-12 rounded-full" style={{ backgroundColor: colorInfo.color }} />
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-600">{colorInfo.label}</span>
                      </div>
                      <div className="relative h-40" style={{ width: stackWidth }}>
                        {properties.map((property, index) => {
                          const houseCount = state.ownership[property.id]?.houses ?? 0
                          const offsetX = index * 24
                          const cardZIndex = properties.length - index
                          const cardTilt = (index - (properties.length - 1) / 2) * 3
                          const buildingLabel =
                            houseCount === 0
                              ? 'No buildings'
                              : houseCount === 5
                              ? 'Hotel'
                              : `${houseCount} House${houseCount === 1 ? '' : 's'}`
                          return (
                            <div
                              key={property.id}
                              className="absolute bottom-0 flex w-32 flex-col gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm transition-transform duration-200 hover:-translate-y-1"
                              style={{
                                left: `${offsetX}px`,
                                zIndex: cardZIndex,
                                transform: `rotate(${cardTilt}deg)`,
                                transformOrigin: 'bottom center',
                              }}
                              title={property.name}
                            >
                              <div className="h-2 rounded-sm" style={{ backgroundColor: colorInfo.color }} />
                              <div className="text-sm font-semibold text-neutral-900">
                                {property.shortName ?? property.name}
                              </div>
                              <div className="text-xs text-neutral-500">{formatCurrency(property.cost)}</div>
                              <div className="text-xs font-medium text-neutral-600">{buildingLabel}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {isPropertyPanelMinimized && (
        <div className="fixed bottom-4 right-4 z-30">
          <button
            type="button"
            onClick={() => setPropertyPanelMinimized(false)}
            aria-expanded={!isPropertyPanelMinimized}
            aria-controls="property-tray-content"
            aria-label={propertyPanelToggleAriaLabel}
            className="group inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 shadow-lg transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <span>{propertyPanelToggleText}</span>
            <svg
              className="h-3 w-3 -rotate-90 transition-transform"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M6 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default App
