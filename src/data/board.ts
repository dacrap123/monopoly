export type SpaceType =
  | 'go'
  | 'property'
  | 'railroad'
  | 'utility'
  | 'tax'
  | 'chance'
  | 'community-chest'
  | 'jail'
  | 'free-parking'
  | 'go-to-jail'

export type ColorGroup =
  | 'brown'
  | 'light-blue'
  | 'magenta'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'dark-blue'

export interface BaseSpace {
  id: number
  name: string
  type: SpaceType
  shortName?: string
}

export interface PropertySpace extends BaseSpace {
  type: 'property'
  color: ColorGroup
  cost: number
  rent: [number, number, number, number, number, number]
  houseCost: number
  mortgage: number
}

export interface RailroadSpace extends BaseSpace {
  type: 'railroad'
  cost: number
  rent: [number, number, number, number]
  mortgage: number
}

export interface UtilitySpace extends BaseSpace {
  type: 'utility'
  cost: number
  mortgage: number
}

export interface TaxSpace extends BaseSpace {
  type: 'tax'
  amount: number
}

export interface DrawCardSpace extends BaseSpace {
  type: 'chance' | 'community-chest'
}

export interface JailSpace extends BaseSpace {
  type: 'jail'
}

export interface FreeParkingSpace extends BaseSpace {
  type: 'free-parking'
}

export interface GoToJailSpace extends BaseSpace {
  type: 'go-to-jail'
}

export interface GoSpace extends BaseSpace {
  type: 'go'
}

export type BoardSpace =
  | PropertySpace
  | RailroadSpace
  | UtilitySpace
  | TaxSpace
  | DrawCardSpace
  | JailSpace
  | FreeParkingSpace
  | GoToJailSpace
  | GoSpace

export const BOARD_SPACES: BoardSpace[] = [
  { id: 0, type: 'go', name: 'GO' },
  {
    id: 1,
    type: 'property',
    name: 'Mediterranean Avenue',
    shortName: 'Mediterranean',
    color: 'brown',
    cost: 60,
    rent: [2, 10, 30, 90, 160, 250],
    houseCost: 50,
    mortgage: 30,
  },
  { id: 2, type: 'community-chest', name: 'Community Chest' },
  {
    id: 3,
    type: 'property',
    name: 'Baltic Avenue',
    shortName: 'Baltic',
    color: 'brown',
    cost: 60,
    rent: [4, 20, 60, 180, 320, 450],
    houseCost: 50,
    mortgage: 30,
  },
  { id: 4, type: 'tax', name: 'Income Tax', amount: 200 },
  {
    id: 5,
    type: 'railroad',
    name: 'Reading Railroad',
    cost: 200,
    rent: [25, 50, 100, 200],
    mortgage: 100,
  },
  {
    id: 6,
    type: 'property',
    name: 'Oriental Avenue',
    shortName: 'Oriental',
    color: 'light-blue',
    cost: 100,
    rent: [6, 30, 90, 270, 400, 550],
    houseCost: 50,
    mortgage: 50,
  },
  { id: 7, type: 'chance', name: 'Chance' },
  {
    id: 8,
    type: 'property',
    name: 'Vermont Avenue',
    shortName: 'Vermont',
    color: 'light-blue',
    cost: 100,
    rent: [6, 30, 90, 270, 400, 550],
    houseCost: 50,
    mortgage: 50,
  },
  {
    id: 9,
    type: 'property',
    name: 'Connecticut Avenue',
    shortName: 'Connecticut',
    color: 'light-blue',
    cost: 120,
    rent: [8, 40, 100, 300, 450, 600],
    houseCost: 50,
    mortgage: 60,
  },
  { id: 10, type: 'jail', name: 'Just Visiting / In Jail' },
  {
    id: 11,
    type: 'property',
    name: 'St. Charles Place',
    shortName: 'St. Charles',
    color: 'magenta',
    cost: 140,
    rent: [10, 50, 150, 450, 625, 750],
    houseCost: 100,
    mortgage: 70,
  },
  {
    id: 12,
    type: 'utility',
    name: 'Electric Company',
    cost: 150,
    mortgage: 75,
  },
  {
    id: 13,
    type: 'property',
    name: 'States Avenue',
    shortName: 'States',
    color: 'magenta',
    cost: 140,
    rent: [10, 50, 150, 450, 625, 750],
    houseCost: 100,
    mortgage: 70,
  },
  {
    id: 14,
    type: 'property',
    name: 'Virginia Avenue',
    shortName: 'Virginia',
    color: 'magenta',
    cost: 160,
    rent: [12, 60, 180, 500, 700, 900],
    houseCost: 100,
    mortgage: 80,
  },
  {
    id: 15,
    type: 'railroad',
    name: 'Pennsylvania Railroad',
    cost: 200,
    rent: [25, 50, 100, 200],
    mortgage: 100,
  },
  {
    id: 16,
    type: 'property',
    name: 'St. James Place',
    shortName: 'St. James',
    color: 'orange',
    cost: 180,
    rent: [14, 70, 200, 550, 750, 950],
    houseCost: 100,
    mortgage: 90,
  },
  { id: 17, type: 'community-chest', name: 'Community Chest' },
  {
    id: 18,
    type: 'property',
    name: 'Tennessee Avenue',
    shortName: 'Tennessee',
    color: 'orange',
    cost: 180,
    rent: [14, 70, 200, 550, 750, 950],
    houseCost: 100,
    mortgage: 90,
  },
  {
    id: 19,
    type: 'property',
    name: 'New York Avenue',
    shortName: 'New York',
    color: 'orange',
    cost: 200,
    rent: [16, 80, 220, 600, 800, 1000],
    houseCost: 100,
    mortgage: 100,
  },
  { id: 20, type: 'free-parking', name: 'Free Parking' },
  {
    id: 21,
    type: 'property',
    name: 'Kentucky Avenue',
    shortName: 'Kentucky',
    color: 'red',
    cost: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    houseCost: 150,
    mortgage: 110,
  },
  { id: 22, type: 'chance', name: 'Chance' },
  {
    id: 23,
    type: 'property',
    name: 'Indiana Avenue',
    shortName: 'Indiana',
    color: 'red',
    cost: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    houseCost: 150,
    mortgage: 110,
  },
  {
    id: 24,
    type: 'property',
    name: 'Illinois Avenue',
    shortName: 'Illinois',
    color: 'red',
    cost: 240,
    rent: [20, 100, 300, 750, 925, 1100],
    houseCost: 150,
    mortgage: 120,
  },
  {
    id: 25,
    type: 'railroad',
    name: 'B. & O. Railroad',
    cost: 200,
    rent: [25, 50, 100, 200],
    mortgage: 100,
  },
  {
    id: 26,
    type: 'property',
    name: 'Atlantic Avenue',
    shortName: 'Atlantic',
    color: 'yellow',
    cost: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgage: 130,
  },
  {
    id: 27,
    type: 'property',
    name: 'Ventnor Avenue',
    shortName: 'Ventnor',
    color: 'yellow',
    cost: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgage: 130,
  },
  {
    id: 28,
    type: 'utility',
    name: 'Water Works',
    cost: 150,
    mortgage: 75,
  },
  {
    id: 29,
    type: 'property',
    name: 'Marvin Gardens',
    shortName: 'Marvin Gardens',
    color: 'yellow',
    cost: 280,
    rent: [24, 120, 360, 850, 1025, 1200],
    houseCost: 150,
    mortgage: 140,
  },
  { id: 30, type: 'go-to-jail', name: 'Go to Jail' },
  {
    id: 31,
    type: 'property',
    name: 'Pacific Avenue',
    shortName: 'Pacific',
    color: 'green',
    cost: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    houseCost: 200,
    mortgage: 150,
  },
  {
    id: 32,
    type: 'property',
    name: 'North Carolina Avenue',
    shortName: 'North Carolina',
    color: 'green',
    cost: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    houseCost: 200,
    mortgage: 150,
  },
  { id: 33, type: 'community-chest', name: 'Community Chest' },
  {
    id: 34,
    type: 'property',
    name: 'Pennsylvania Avenue',
    shortName: 'Pennsylvania',
    color: 'green',
    cost: 320,
    rent: [28, 150, 450, 1000, 1200, 1400],
    houseCost: 200,
    mortgage: 160,
  },
  {
    id: 35,
    type: 'railroad',
    name: 'Short Line',
    cost: 200,
    rent: [25, 50, 100, 200],
    mortgage: 100,
  },
  { id: 36, type: 'chance', name: 'Chance' },
  {
    id: 37,
    type: 'property',
    name: 'Park Place',
    shortName: 'Park Place',
    color: 'dark-blue',
    cost: 350,
    rent: [35, 175, 500, 1100, 1300, 1500],
    houseCost: 200,
    mortgage: 175,
  },
  { id: 38, type: 'tax', name: 'Luxury Tax', amount: 100 },
  {
    id: 39,
    type: 'property',
    name: 'Boardwalk',
    shortName: 'Boardwalk',
    color: 'dark-blue',
    cost: 400,
    rent: [50, 200, 600, 1400, 1700, 2000],
    houseCost: 200,
    mortgage: 200,
  },
]

export const COLOR_GROUP_DISPLAY: Record<ColorGroup, { label: string; color: string }> = {
  brown: { label: 'Brown', color: '#955436' },
  'light-blue': { label: 'Light Blue', color: '#9ad8f7' },
  magenta: { label: 'Magenta', color: '#d94fa6' },
  orange: { label: 'Orange', color: '#f89736' },
  red: { label: 'Red', color: '#e63946' },
  yellow: { label: 'Yellow', color: '#f9c74f' },
  green: { label: 'Green', color: '#2a9d8f' },
  'dark-blue': { label: 'Dark Blue', color: '#264653' },
}

export const PROPERTY_IDS_BY_COLOR = BOARD_SPACES.reduce<Record<ColorGroup, number[]>>((acc, space) => {
  if (space.type === 'property') {
    if (!acc[space.color]) {
      acc[space.color] = []
    }
    acc[space.color].push(space.id)
  }
  return acc
}, {
  brown: [],
  'light-blue': [],
  magenta: [],
  orange: [],
  red: [],
  yellow: [],
  green: [],
  'dark-blue': [],
})
