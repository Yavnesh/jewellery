import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); console.log({ p: !!p, user: !!p.user, pv: !!p.productVariant, co: !!p.customer_order, pay: !!p.payment });
