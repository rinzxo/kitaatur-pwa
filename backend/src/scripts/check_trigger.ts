import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.$queryRawUnsafe(`
    SELECT routine_definition
    FROM information_schema.routines
    WHERE routine_type = 'FUNCTION' AND routine_schema = 'public' AND routine_name = 'handle_new_user';
  `)
  console.log(JSON.stringify(result, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
