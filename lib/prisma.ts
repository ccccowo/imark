import { PrismaClient } from '@prisma/client'
import type { PrismaClient as PrismaClientType } from '@prisma/client'

declare global {
  var prisma: PrismaClientType | undefined
}

export const prisma = global.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// 测试数据库连接
prisma.$connect()
  .then(() => {
    console.log('✅ 数据库连接成功')
  })
  .catch((error) => {
    console.error('❌ 数据库连接失败:', error)
  })

export default prisma