type CardBase = {
  id: string
  description: string
}

export type CardAction =
  | ({ kind: 'collect'; amount: number } & CardBase)
  | ({ kind: 'pay'; amount: number } & CardBase)
  | ({ kind: 'advance'; position: number; passGo?: boolean } & CardBase)
  | ({ kind: 'move-spaces'; spaces: number } & CardBase)
  | (CardBase & { kind: 'advance-nearest-utility' })
  | (CardBase & { kind: 'advance-nearest-railroad' })
  | (CardBase & { kind: 'go-to-jail' })
  | (CardBase & { kind: 'collect-each-player'; amount: number })
  | (CardBase & { kind: 'pay-each-player'; amount: number })
  | (CardBase & { kind: 'property-expense'; perHouse: number; perHotel: number })
  | (CardBase & { kind: 'property-collect'; perHouse: number; perHotel: number })
  | (CardBase & { kind: 'get-out-of-jail' })
  | (CardBase & { kind: 'advance-to-go' })

export type Card = CardAction

export const CHANCE_CARDS: Card[] = [
  { id: 'chance-advance-go', kind: 'advance-to-go', description: 'Advance to GO (Collect $200)' },
  {
    id: 'chance-advance-illinois',
    kind: 'advance',
    description: 'Advance to Illinois Avenue',
    position: 24,
    passGo: true,
  },
  {
    id: 'chance-advance-boardwalk',
    kind: 'advance',
    description: 'Advance to Boardwalk',
    position: 39,
    passGo: false,
  },
  {
    id: 'chance-advance-stcharles',
    kind: 'advance',
    description: 'Advance to St. Charles Place – If you pass GO collect $200',
    position: 11,
    passGo: true,
  },
  {
    id: 'chance-nearest-utility',
    kind: 'advance-nearest-utility',
    description: 'Advance token to nearest Utility. If unowned you may buy it from the Bank. If owned throw dice and pay owner ten times the amount thrown.',
  },
  {
    id: 'chance-nearest-railroad-1',
    kind: 'advance-nearest-railroad',
    description: 'Advance token to the nearest Railroad and pay owner twice the rental to which they are otherwise entitled. If Railroad is unowned, you may buy it from the Bank.',
  },
  {
    id: 'chance-nearest-railroad-2',
    kind: 'advance-nearest-railroad',
    description: 'Advance token to the nearest Railroad and pay owner twice the rental to which they are otherwise entitled. If Railroad is unowned, you may buy it from the Bank.',
  },
  {
    id: 'chance-dividend',
    kind: 'collect',
    description: 'Bank pays you dividend of $50',
    amount: 50,
  },
  {
    id: 'chance-get-out-of-jail',
    kind: 'get-out-of-jail',
    description: 'Get out of Jail Free – This card may be kept until needed, or traded.',
  },
  {
    id: 'chance-go-back-three',
    kind: 'move-spaces',
    description: 'Go Back 3 Spaces',
    spaces: -3,
  },
  {
    id: 'chance-go-to-jail',
    kind: 'go-to-jail',
    description: 'Go directly to Jail – Do not pass GO, do not collect $200',
  },
  {
    id: 'chance-general-repairs',
    kind: 'property-expense',
    description: 'Make general repairs on all your property – For each house pay $25 – For each hotel pay $100',
    perHouse: 25,
    perHotel: 100,
  },
  {
    id: 'chance-poor-tax',
    kind: 'pay',
    description: 'Pay poor tax of $15',
    amount: 15,
  },
  {
    id: 'chance-building-loan',
    kind: 'collect',
    description: 'Your building loan matures – Receive $150',
    amount: 150,
  },
  {
    id: 'chance-chairman',
    kind: 'pay-each-player',
    description: 'You have been elected Chairman of the Board – Pay each player $50',
    amount: 50,
  },
  {
    id: 'chance-crossword',
    kind: 'collect',
    description: 'You have won a crossword competition – Collect $100',
    amount: 100,
  },
]

export const COMMUNITY_CHEST_CARDS: Card[] = [
  { id: 'cc-advance-go', kind: 'advance-to-go', description: 'Advance to GO (Collect $200)' },
  {
    id: 'cc-bank-error',
    kind: 'collect',
    description: 'Bank error in your favor – Collect $200',
    amount: 200,
  },
  {
    id: 'cc-doctors-fee',
    kind: 'pay',
    description: "Doctor's fees – Pay $50",
    amount: 50,
  },
  {
    id: 'cc-stock-sale',
    kind: 'collect',
    description: 'From sale of stock you get $50',
    amount: 50,
  },
  {
    id: 'cc-get-out-of-jail',
    kind: 'get-out-of-jail',
    description: 'Get out of Jail Free – This card may be kept until needed, or traded.',
  },
  {
    id: 'cc-go-to-jail',
    kind: 'go-to-jail',
    description: 'Go directly to Jail – Do not pass GO, do not collect $200',
  },
  {
    id: 'cc-grand-opera',
    kind: 'collect',
    description: 'Grand Opera Night – Collect $50 from every player for opening night seats',
    amount: 50,
  },
  {
    id: 'cc-holiday-fund',
    kind: 'collect',
    description: 'Holiday Fund matures – Receive $100',
    amount: 100,
  },
  {
    id: 'cc-income-tax-refund',
    kind: 'collect',
    description: 'Income tax refund – Collect $20',
    amount: 20,
  },
  {
    id: 'cc-birthday',
    kind: 'collect-each-player',
    description: 'It is your birthday – Collect $10 from every player',
    amount: 10,
  },
  {
    id: 'cc-life-insurance',
    kind: 'collect',
    description: 'Life insurance matures – Collect $100',
    amount: 100,
  },
  {
    id: 'cc-hospital-fees',
    kind: 'pay',
    description: 'Pay hospital fees of $100',
    amount: 100,
  },
  {
    id: 'cc-school-fees',
    kind: 'pay',
    description: 'Pay school fees of $50',
    amount: 50,
  },
  {
    id: 'cc-consultant',
    kind: 'collect',
    description: 'Receive $25 consultancy fee',
    amount: 25,
  },
  {
    id: 'cc-street-repairs',
    kind: 'property-expense',
    description: 'You are assessed for street repairs – $40 per house, $115 per hotel',
    perHouse: 40,
    perHotel: 115,
  },
  {
    id: 'cc-beauty',
    kind: 'collect',
    description: 'You have won second prize in a beauty contest – Collect $10',
    amount: 10,
  },
  {
    id: 'cc-inherit',
    kind: 'collect',
    description: 'You inherit $100',
    amount: 100,
  },
]
