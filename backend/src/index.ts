import express from 'express'
import cors from 'cors'
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

const app = express()
const port = process.env.PORT || 5000

// Handle Chrome Private Network Access (PNA) block for Railway IPv6 addresses
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
  next()
})

app.use(cors({
  origin: ['https://kitatur.rinzgroup.web.id', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}))
app.use(express.json())

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
