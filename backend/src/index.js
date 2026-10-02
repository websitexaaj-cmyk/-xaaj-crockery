// ============================================================
// XAAJ Backend - Main Server File
// ============================================================

// -------------------------
// 1. External Packages
// -------------------------
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'

// -------------------------
// 2. Configuration
// -------------------------
import {
  env,
  assertProductionConfig
} from './config/env.js'

// -------------------------
// 3. Database
// -------------------------
import {
  connectDatabase,
  disconnectDatabase
} from './config/db.js'

// -------------------------
// 4. Routes
// -------------------------
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import commerceRoutes from './routes/commerce.js'
import orderRoutes from './routes/orders.js'
import velocityTestRoutes from './routes/velocityTest.js'
import cmsRoutes from './routes/cms.js'
import blogRoutes from './routes/blogs.js'
import newsletterRoutes from './routes/newsletter.js'
import contactRoutes from './routes/contact.js'
import adminRoutes from './routes/admin.js'
import paymentRoutes from './routes/payments.js'
import uploadRoutes from './routes/uploads.js'
import reviewRoutes from './routes/reviews.js'

// -------------------------
// 5. Middleware
// -------------------------
import {
  notFound,
  errorHandler
} from './middleware/index.js'


// ============================================================
// 6. Validate Environment Configuration
// ============================================================

assertProductionConfig()


// ============================================================
// 7. Create Express Application
// ============================================================

const app = express()


// ============================================================
// 8. Basic Security
// ============================================================

app.disable('x-powered-by')

app.use(helmet())


// ============================================================
// 9. CORS Configuration
// ============================================================

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
)


// ============================================================
// 10. Rate Limiting
// ============================================================

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8'
  })
)


// ============================================================
// 11. Body Parsers
// ============================================================

app.use(
  express.json({
    limit: '1mb'
  })
)

app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb'
  })
)


// ============================================================
// 12. Cookie Parser
// ============================================================

app.use(
  cookieParser(env.cookieSecret)
)


// ============================================================
// 13. Request Data Sanitization
// ============================================================

app.use((req, _res, next) => {

  for (const source of [
    req.body,
    req.params,
    req.query
  ]) {

    if (
      source &&
      typeof source === 'object'
    ) {

      for (
        const key of Object.keys(source)
      ) {

        if (
          key.startsWith('$') ||
          key.includes('.')
        ) {
          delete source[key]
        }

      }
    }
  }

  next()
})


// ============================================================
// 14. HTTP Request Logger
// ============================================================

app.use(
  morgan(
    env.nodeEnv === 'production'
      ? 'combined'
      : 'dev'
  )
)


// ============================================================
// 15. Health Check
// ============================================================

app.get(
  '/api/health',
  (_req, res) => {

    res.json({
      success: true,
      service: 'xaaj-api',
      timestamp:
        new Date().toISOString()
    })

  }
)


// ============================================================
// 16. API Routes
// ============================================================

// -------------------------
// Authentication
// -------------------------
app.use(
  '/api/auth',
  authRoutes
)


// -------------------------
// Products
// -------------------------
app.use(
  '/api/products',
  productRoutes
)


// -------------------------
// Commerce
// -------------------------
app.use(
  '/api/commerce',
  commerceRoutes
)


// -------------------------
// Orders
// -------------------------
app.use(
  '/api/orders',
  orderRoutes
)


// -------------------------
// Velocity Test
// -------------------------
// Test Velocity API authentication
//
// GET /api/velocity/test
// -------------------------
app.use(
  '/api/velocity',
  velocityTestRoutes
)


// -------------------------
// Reviews
// -------------------------
// Customer product reviews
//
// POST   /api/reviews
// GET    /api/reviews/product/:productId
// GET    /api/reviews/order/:orderId
// -------------------------
app.use(
  '/api/reviews',
  reviewRoutes
)


// -------------------------
// CMS
// -------------------------
app.use(
  '/api/cms',
  cmsRoutes
)


// -------------------------
// Blogs
// -------------------------
app.use(
  '/api/blogs',
  blogRoutes
)


// -------------------------
// Newsletter
// -------------------------
// Customer newsletter subscription
//
// POST /api/newsletter/subscribe
// -------------------------
app.use(
  '/api/newsletter',
  newsletterRoutes
)


// -------------------------
// Contact / B2B Enquiry
// -------------------------
// Customer contact form
// B2B bulk-order enquiry form
//
// POST /api/contact
//
// This sends:
// 1. Enquiry → XAAJ customer care
// 2. Confirmation email → Customer
// -------------------------
app.use(
  '/api/contact',
  contactRoutes
)


// -------------------------
// Admin
// -------------------------
app.use(
  '/api/admin',
  adminRoutes
)


// -------------------------
// Payments
// -------------------------
app.use(
  '/api/payment',
  paymentRoutes
)


// -------------------------
// Uploads
// -------------------------
app.use(
  '/api/uploads',
  uploadRoutes
)


// ============================================================
// 17. 404 Handler
// ============================================================

app.use(notFound)


// ============================================================
// 18. Global Error Handler
// ============================================================

app.use(errorHandler)


// ============================================================
// 19. Connect Database & Start Server
// ============================================================

// Vercel/serverless environment mein
// app.listen() use nahi hota.
//
// Database connection ko server start
// hone se pehle initialize karna zaroori hai.

await connectDatabase()

const server = app.listen(env.port,() =>{
  console.log('[XAAZ] API listening on port', env.port);
});


// ============================================================
// 20. Graceful Shutdown
// ============================================================

async function shutdown(signal) {

  console.log(
    `[XAAJ] ${signal} received`
  )

  if (server) {

    server.close(
      async () => {

        await disconnectDatabase()

        process.exit(0)

      }
    )

  } else {

    await disconnectDatabase()

    process.exit(0)

  }

}


// ============================================================
// 21. Process Signals
// ============================================================

process.on(
  'SIGTERM',
  () => shutdown('SIGTERM')
)

process.on(
  'SIGINT',
  () => shutdown('SIGINT')
)


// ============================================================
// 22. Export App
// ============================================================

export default app
