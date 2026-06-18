import { COP, PCT, MK } from './constants.js'
import { ML } from './ml.js'

export function genAlerts(cards, txns) {
  const now=new Date();const alerts=[]
  cards.forEach(c=>{
    const u=txns.filter(t=>t.cardId===c.id).reduce((s,t)=>s+t.amount,0)
    const p=PCT(u,c.limit)
    let dp=c.payDay-now.getDate();if(dp<0)dp+=30
    let dc=c.cutDay-now.getDate();if(dc<0)dc+=30
    if(p>85) alerts.push({id:`u3-${c.id}`,type:"danger",icon:"🚨",title:`${c.franchise} ····${c.last4} al ${p}%`,body:`Cupo casi agotado en ${c.bank}. Riesgo de denegación de transacciones.`,dismissed:false})
    else if(p>65) alerts.push({id:`u2-${c.id}`,type:"warning",icon:"⚠️",title:`${c.franchise} ····${c.last4} al ${p}%`,body:`Uso elevado del cupo. Impacta tu score financiero. Ideal mantenerse bajo 60%.`,dismissed:false})
    if(dp<=5) alerts.push({id:`pay-${c.id}`,type:"danger",icon:"📅",title:`Pago vence en ${dp} días`,body:`${c.bank} ${c.franchise} ····${c.last4} vence el día ${c.payDay}. Deuda: ${COP(u)}.`,dismissed:false})
    if(dc<=3) alerts.push({id:`cut-${c.id}`,type:"warning",icon:"✂️",title:`Corte en ${dc} días`,body:`${c.bank} ····${c.last4} cierra el día ${c.cutDay}. Acumulado: ${COP(u)}.`,dismissed:false})
  })
  const thisM=MK(now.toISOString())
  const subs=txns.filter(t=>t.cat==="Suscripciones"&&MK(t.date)===thisM)
  if(subs.length>0) alerts.push({id:"subs",type:"info",icon:"📺",title:`${subs.length} suscripciones este mes`,body:`Total: ${COP(subs.reduce((s,t)=>s+t.amount,0))}. Revisa si todas son necesarias.`,dismissed:false})
  const rMin=ML.riskMin(cards,txns)
  if(rMin>65) alerts.push({id:"riskML",type:"danger",icon:"🤖",title:`ML: ${rMin}% riesgo pago mínimo`,body:"El modelo detecta alta probabilidad de que solo puedas cubrir el pago mínimo este mes.",dismissed:false})
  if(!alerts.length) alerts.push({id:"ok",type:"success",icon:"✅",title:"Finanzas en orden",body:"Todo bajo control. ¡Sigue con el buen ritmo!",dismissed:false})
  return alerts
}
