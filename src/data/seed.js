import { UID } from '../utils/constants.js'

export const SEED = (() => {
  const now = new Date()
  const mk = (n, c, a, cid, days, cu = 1, cur = 1) => {
    const d = new Date(now)
    d.setDate(d.getDate() - days)
    return { id: UID(), name: n, cat: c, amount: a, cardId: cid, date: d.toISOString().split('T')[0], cuotas: cu, cuotaNum: cur, note: '' }
  }
  const pv = (n, c, a, cid, mb, day) => {
    const d = new Date(now.getFullYear(), now.getMonth() - mb, day)
    return { id: UID(), name: n, cat: c, amount: a, cardId: cid, date: d.toISOString().split('T')[0], cuotas: 1, cuotaNum: 1, note: '' }
  }
  return {
    cards: [
      { id: 'c1', bank: 'Bancolombia', franchise: 'Visa', name: 'Infinite', last4: '4821', limit: 15000000, theme: 'teal', cutDay: 22, payDay: 7, holder: 'CARLOS TORRES' },
      { id: 'c2', bank: 'Davivienda', franchise: 'Mastercard', name: 'Gold', last4: '3307', limit: 8000000, theme: 'ruby', cutDay: 15, payDay: 28, holder: 'CARLOS TORRES' },
    ],
    txns: [
      mk('El Corral Gourmet', 'Restaurantes', 89000, 'c1', 0),
      mk('Éxito Salitre', 'Supermercado', 312000, 'c2', 1),
      mk('Netflix', 'Suscripciones', 47900, 'c1', 1),
      mk('Uber', 'Transporte', 23500, 'c1', 2),
      mk('Farmacia Cruz Verde', 'Salud', 67000, 'c2', 3),
      mk('Cinemark Santafé', 'Entretenimiento', 52000, 'c1', 4),
      mk('Decathlon', 'Ropa', 289000, 'c1', 5, 3, 1),
      mk('EPM Energía', 'Servicios', 186000, 'c2', 6),
      mk('Andrés Carne de Res', 'Restaurantes', 345000, 'c1', 8),
      mk('Carulla', 'Supermercado', 267000, 'c2', 9),
      mk('Spotify', 'Suscripciones', 19900, 'c1', 9),
      mk('Claro', 'Servicios', 89000, 'c2', 10),
      mk('InDrive', 'Transporte', 34500, 'c1', 11),
      mk('Jumbo Hayuelos', 'Supermercado', 198000, 'c2', 12),
      mk('Cine Colombia', 'Entretenimiento', 38000, 'c1', 14),
      mk('Apple App Store', 'Tecnología', 32900, 'c1', 16),
      mk('Avianca', 'Viajes', 895000, 'c2', 18, 6, 1),
      mk('Farmacia Alemana', 'Salud', 43000, 'c2', 20),
      pv('Restaurante', 'Restaurantes', 320000, 'c1', 1, 8),
      pv('Supermercado', 'Supermercado', 580000, 'c2', 1, 15),
      pv('Uber', 'Transporte', 95000, 'c1', 1, 20),
      pv('Entretenimiento', 'Entretenimiento', 180000, 'c1', 2, 5),
      pv('Restaurante', 'Restaurantes', 290000, 'c1', 2, 18),
      pv('Supermercado', 'Supermercado', 620000, 'c2', 2, 22),
      pv('Netflix', 'Suscripciones', 47900, 'c1', 2, 1),
      pv('Restaurante', 'Restaurantes', 410000, 'c1', 3, 5),
      pv('Supermercado', 'Supermercado', 540000, 'c2', 3, 12),
      pv('Viajes', 'Viajes', 1200000, 'c2', 3, 15),
      pv('Restaurante', 'Restaurantes', 275000, 'c1', 4, 8),
      pv('Supermercado', 'Supermercado', 490000, 'c2', 4, 20),
      pv('Tecnología', 'Tecnología', 240000, 'c1', 4, 25),
      pv('Restaurante', 'Restaurantes', 380000, 'c1', 5, 7),
      pv('Supermercado', 'Supermercado', 610000, 'c2', 5, 14),
      pv('Salud', 'Salud', 95000, 'c2', 5, 21),
    ],
  }
})()
