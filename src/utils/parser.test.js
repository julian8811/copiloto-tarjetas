import { describe, it, expect } from 'vitest'
import { FP } from './parser.js'

describe('FP.parseAmt', () => {
  it('parses plain numbers', () => {
    expect(FP.parseAmt(89000)).toBe(89000)
    expect(FP.parseAmt(-500)).toBe(500)
  })

  it('parses US format', () => {
    expect(FP.parseAmt('1,234.56')).toBe(1234.56)
  })

  it('parses EU format', () => {
    expect(FP.parseAmt('1.234,56')).toBe(1234.56)
  })

  it('parses COP strings', () => {
    expect(FP.parseAmt('890000')).toBe(890000)
    expect(FP.parseAmt('$ 1.234.567')).toBe(1234567)
  })

  it('returns 0 for invalid input', () => {
    expect(FP.parseAmt('')).toBe(0)
    expect(FP.parseAmt('abc')).toBe(0)
  })
})

describe('FP.catFrom', () => {
  it('categorizes restaurants', () => {
    expect(FP.catFrom('Restaurante El Corral')).toBe('Restaurantes')
    expect(FP.catFrom('McDonald\'s')).toBe('Restaurantes')
  })

  it('categorizes supermarkets', () => {
    expect(FP.catFrom('Éxito Salitre')).toBe('Supermercado')
    expect(FP.catFrom('CARULLA 123')).toBe('Supermercado')
  })

  it('categorizes transport', () => {
    expect(FP.catFrom('Uber Trip')).toBe('Transporte')
  })

  it('returns Otros for unknown', () => {
    expect(FP.catFrom('Comercio Desconocido XYZ')).toBe('Otros')
  })
})
