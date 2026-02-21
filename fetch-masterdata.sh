set -e

# Fetch sets
# pnpm script masterdata/scripts/fetch-sets.ts <category> <category2> <folder>
# pnpm script masterdata/scripts/fetch-sets.ts booster-packs core-boosters core
# pnpm script masterdata/scripts/fetch-sets.ts decks structure-decks structure-decks
# pnpm script masterdata/scripts/fetch-sets.ts decks starter-decks starter-decks
pnpm script masterdata/scripts/fetch-sets.ts booster-packs prize-packs tournament

# Fetch individual set details
# pnpm script masterdata/scripts/fetch-single-sets.ts <folder>
pnpm script masterdata/scripts/fetch-single-sets.ts tournament

# Fetch cards
pnpm script masterdata/scripts/fetch-cards.ts tournament
# pnpm script masterdata/scripts/fetch-cards.ts <folder>
