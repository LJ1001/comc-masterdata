generate:
    bun src/scripts/map-all-cards.ts
    bun src/scripts/generate-cards-sql.ts
    bun src/scripts/generate-sets-sql.ts
    bun src/scripts/map-all-variants.ts
    bun src/scripts/generate-variants-sql.ts
    mv src/data/cards/insert-cards.sql sql/
    mv src/data/sets/insert-sets.sql sql/
    mv src/data/variants/insert-variants.sql sql/
    # cp sql/insert-cards.sql ../scripts/data/sql/insert-cards.sql
    # cp sql/insert-sets.sql ../scripts/data/sql/insert-sets.sql
    # cp sql/insert-variants.sql ../scripts/data/sql/insert-variants.sql
