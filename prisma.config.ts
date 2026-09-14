import { defineConfig } from '@prisma/config'

try {
  process.loadEnvFile()
} catch (e) {
  // Ignore if .env is not found or already loaded
}

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL
  }
})
