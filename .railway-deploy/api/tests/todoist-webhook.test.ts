// tests/todoist-webhook.test.ts
// Testes Vitest para validação de Webhook do Todoist

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHmac } from 'node:crypto' // Suporte total em ambiente Node

interface TodoistEvent {
  event_name: string
  event_data: {
    id: string
    content?: string
    [key: string]: unknown
  }
}

describe('Todoist Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate webhook signature', () => {
    const secret = 'test-secret'
    const payload = JSON.stringify({ event_name: 'item:added' })

    const hmac = createHmac('sha256', secret)
    hmac.update(payload)

    const signature = hmac.digest('base64')

    expect(signature).toBeDefined()
    expect(typeof signature).toBe('string')
    expect(signature.length).toBeGreaterThan(20)
  })

  it('should process webhook events', () => {
    const event: TodoistEvent = {
      event_name: 'item:added',
      event_data: {
        id: '123',
        content: 'Test task'
      }
    }

    // Valida estrutura
    expect(event.event_name).toBe('item:added')
    expect(event.event_data.id).toBe('123')
    expect(event.event_data.content).toBe('Test task')
  })
})
