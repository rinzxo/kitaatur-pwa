import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import hpp from 'hpp'
import dotenv from 'dotenv'

dotenv.config()

import personalRoutes from './routes/personal.routes'
import webhookRoutes from './routes/webhook.routes'
import subscriptionRoutes from './routes/subscription.routes'
import orgRoutes from './routes/org.routes'
import financialRoutes from './routes/financial.routes'
import attendanceRoutes from './routes/attendance.routes'
import paymentRoutes from './routes/payment.routes'
import meetingRoutes from './routes/meeting.routes'
import notificationRoutes from './routes/notification.routes'
import scheduleRoutes from './routes/schedule.routes'
import schoolRoutes from './routes/school.routes'
import adminRoutes from './routes/admin.routes'

import { maintenanceCheck } from './middleware/maintenance.middleware'

import { initJobs } from './jobs/reminder.job'
import { initSessionJobs } from './jobs/session.job'

const app = express()
const port = process.env.PORT || 5000

// Trust proxy if we are behind a reverse proxy (e.g. Railway, Vercel)
app.set('trust proxy', 1)

// Cybersecurity Middlewares
app.use(helmet())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, 
  legacyHeaders: false,
})
app.use(limiter)

// Initialize background jobs
initJobs()
initSessionJobs()

// Handle Chrome Private Network Access (PNA) block for Railway IPv6 addresses
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
  next()
})

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}))
app.use(express.json())

// HTTP Parameter Pollution prevention
app.use(hpp())

// Maintenance Check Middleware (runs before all routes)
app.use(maintenanceCheck)

// Register Routes
app.use('/api/personal', personalRoutes)
app.use('/api/webhooks', webhookRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/subscription', subscriptionRoutes)
app.use('/api/org', orgRoutes)
app.use('/api/org-financial', financialRoutes)
app.use('/api/org-attendance', attendanceRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/org-meeting', meetingRoutes)
app.use('/api/org-schedule', scheduleRoutes)
app.use('/api/school', schoolRoutes)
app.use('/api/admin', adminRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

app.listen(port, () => {
  console.log(`[KitaAtur Server] Running on http://localhost:${port}`)
})
export default app
