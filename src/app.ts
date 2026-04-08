import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { ZodError } from 'zod'
import { env } from './config/env.js'
import { corsConfig } from './config/cors.js'
import authPlugin from './plugins/auth.plugin.js'
import tenantPlugin from './plugins/tenant.plugin.js'
import auditPlugin from './plugins/audit.plugin.js'
import { registerRoutes } from './routes.js'
import { AppError } from './common/errors.js'

const app = Fastify({ logger: true })

await app.register(cors, corsConfig)
await app.register(multipart)
await app.register(authPlugin)
await app.register(tenantPlugin)
await app.register(auditPlugin)
await app.register(registerRoutes, { prefix: '/api' })

const homeHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Orquestos Restaurant API</title>
  <style>
    :root { color-scheme: dark; --bg: #0f1419; --card: #1a2332; --accent: #e8a849; --text: #e8ecf1; --muted: #8b9aad; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: ui-sans-serif, system-ui, sans-serif; background: radial-gradient(ellipse 120% 80% at 50% -20%, #2a1f0f 0%, var(--bg) 55%); color: var(--text); display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .card { max-width: 32rem; background: var(--card); border: 1px solid rgba(232,168,73,.25); border-radius: 16px; padding: 2rem 2.25rem; box-shadow: 0 24px 48px rgba(0,0,0,.35); }
    h1 { margin: 0 0 .5rem; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }
    .badge { display: inline-block; font-size: .7rem; text-transform: uppercase; letter-spacing: .12em; color: var(--accent); margin-bottom: 1rem; }
    p { margin: 0 0 1rem; line-height: 1.6; color: var(--muted); font-size: .95rem; }
    code { font-family: ui-monospace, monospace; font-size: .85rem; background: rgba(0,0,0,.35); padding: .2rem .45rem; border-radius: 6px; color: var(--accent); }
    ul { margin: 0; padding-left: 1.2rem; color: var(--muted); font-size: .9rem; line-height: 1.7; }
    .foot { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,.08); font-size: .8rem; color: var(--muted); }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Backend</span>
    <h1>Orquestos Restaurant API</h1>
    <p>Servidor en ejecución. Esta página es pública; el resto de rutas requieren autenticación.</p>
    <ul>
      <li>Login: <code>POST /api/auth/login</code></li>
      <li>API: prefijo <code>/api</code></li>
    </ul>
    <p class="foot">Documenta tus endpoints o conecta el frontend aquí.</p>
  </div>
</body>
</html>`

app.get('/', async (_request, reply) => {
  return reply.type('text/html; charset=utf-8').send(homeHtml)
})

app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      message: error.message,
      code: error.code,
      status: error.statusCode,
    })
  }

  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => issue.message).join(' · ')
    return reply.status(400).send({
      message: message || 'Datos no válidos',
      code: 'VALIDATION_ERROR',
      status: 400,
      issues: error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    })
  }

  request.log.error(error)
  return reply.status(500).send({
    message: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
    status: 500,
  })
})

app.listen({ port: env.PORT, host: env.HOST }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
