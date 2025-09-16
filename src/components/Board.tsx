import React from 'react'
import { BOARD_POSITIONS } from '../data/layout'
import { BOARD_SPACES, BoardSpace, COLOR_GROUP_DISPLAY } from '../data/board'
import { OwnedSpaceState } from '../utils/gameHelpers'
import { Player } from '../utils/gameEngine'

interface BoardProps {
  ownership: Record<number, OwnedSpaceState>
  players: Player[]
  currentPlayerId: number
}

const Board: React.FC<BoardProps> = ({ ownership, players, currentPlayerId }) => {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="grid aspect-square w-full grid-cols-11 grid-rows-11 gap-[2px] rounded-3xl bg-neutral-300 p-2 shadow-inner">
        {BOARD_SPACES.map((space) => {
          const position = BOARD_POSITIONS[space.id]
          const owned = ownership[space.id]
          const owner = owned?.ownerId != null ? players.find((player) => player.id === owned.ownerId && !player.bankrupt) : undefined
          const playersHere = players.filter((player) => !player.bankrupt && player.position === space.id)

          return (
            <div
              key={space.id}
              style={{ gridColumn: position.col, gridRow: position.row }}
              className="relative"
            >
              <div
                className={`relative flex h-full w-full flex-col items-center gap-1 rounded-xl border border-neutral-300 bg-white px-1 py-2 text-center text-neutral-700 ${
                  owner ? 'shadow-[0_0_0_2px_rgba(0,0,0,0.05)]' : ''
                }`}
                style={owner ? { boxShadow: `0 0 0 2px ${owner.color}55` } : undefined}
              >
                <SpaceContent space={space} owned={owned} />
                <div className="flex w-full flex-1 flex-col items-center px-0.5 text-center">
                  <div className="w-full max-w-[95%] whitespace-normal break-words text-[7px] font-semibold leading-[1.15] text-neutral-900">
                    {space.shortName ?? space.name}
                  </div>
                  <div className="mt-0.5 w-full text-[6.5px] font-semibold uppercase tracking-wide text-neutral-500 leading-[1.15]">
                    {renderSpaceSubtitle(space)}
                  </div>
                  {owner && (
                    <div
                      className="mt-0.5 w-full truncate text-[6.5px] font-bold leading-[1.15]"
                      style={{ color: owner.color }}
                    >
                      {owner.name}
                    </div>
                  )}
                </div>
              </div>
              {playersHere.length > 0 && (
                <div className="absolute bottom-1 left-1 flex flex-wrap gap-[2px]">
                  {playersHere.map((player) => (
                    <div
                      key={player.id}
                      className={`h-4 w-4 rounded-full border border-white shadow ${
                        player.id === currentPlayerId ? 'outline outline-2 outline-offset-1 outline-gray-800' : ''
                      }`}
                      style={{ backgroundColor: player.color }}
                      title={player.name}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <div className="col-start-2 col-end-11 row-start-2 row-end-11 flex items-center justify-center rounded-2xl bg-neutral-50 text-5xl font-black uppercase tracking-widest text-neutral-300">
          Monopoly
        </div>
      </div>
    </div>
  )
}

interface SpaceContentProps {
  space: BoardSpace
  owned?: OwnedSpaceState
}

const SpaceContent: React.FC<SpaceContentProps> = ({ space, owned }) => {
  if (space.type === 'property') {
    const color = COLOR_GROUP_DISPLAY[space.color].color
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="h-3 rounded-sm" style={{ backgroundColor: color }} />
        <BuildingDisplay houses={owned?.houses ?? 0} />
      </div>
    )
  }
  if (space.type === 'railroad') {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="text-[20px]">🚂</div>
        <BuildingDisplay houses={0} />
      </div>
    )
  }
  if (space.type === 'utility') {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="text-[20px]">⚡</div>
        <BuildingDisplay houses={0} />
      </div>
    )
  }
  if (space.type === 'tax') {
    return <div className="flex h-full items-center justify-center text-[18px]">💰</div>
  }
  if (space.type === 'chance') {
    return <div className="flex h-full items-center justify-center text-[18px]">❓</div>
  }
  if (space.type === 'community-chest') {
    return <div className="flex h-full items-center justify-center text-[18px]">🎁</div>
  }
  if (space.type === 'go') {
    return <div className="flex h-full items-center justify-center text-[18px]">▶️</div>
  }
  if (space.type === 'go-to-jail') {
    return <div className="flex h-full items-center justify-center text-[18px]">🚔</div>
  }
  if (space.type === 'jail') {
    return <div className="flex h-full items-center justify-center text-[18px]">⛓️</div>
  }
  if (space.type === 'free-parking') {
    return <div className="flex h-full items-center justify-center text-[18px]">🅿️</div>
  }
  return <BuildingDisplay houses={0} />
}

const BuildingDisplay: React.FC<{ houses: number }> = ({ houses }) => {
  if (houses <= 0) {
    return <div className="h-4" />
  }
  if (houses === 5) {
    return <div className="flex h-4 items-center gap-1 text-[16px]">🏨</div>
  }
  return (
    <div className="flex h-4 items-center gap-[2px] text-[14px]">
      {Array.from({ length: houses }).map((_, index) => (
        <span key={index}>🏠</span>
      ))}
    </div>
  )
}

function renderSpaceSubtitle(space: BoardSpace): string {
  switch (space.type) {
    case 'property':
      return `$${space.cost}`
    case 'railroad':
    case 'utility':
      return `$${space.cost}`
    case 'tax':
      return `Pay $${space.amount}`
    default:
      return ''
  }
}

export default Board
