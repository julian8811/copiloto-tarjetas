export const CATS = ["Restaurantes","Supermercado","Transporte","Entretenimiento","Salud","Suscripciones","Viajes","Ropa","Educación","Servicios","Tecnología","Otros"]
export const MNAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

export const COP = n => n == null ? "—" : new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0}).format(Math.abs(n))
export const PCT = (a,b) => b>0?Math.min(Math.round(a/b*100),100):0
export const UID = () => Math.random().toString(36).slice(2,10)
export const TODAY = () => new Date().toISOString().split("T")[0]
export const MK = d => { const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}` }
