import { CATS, PCT, MK, MNAMES } from './constants.js'

export const ML = {
  linReg(pts) {
    const n=pts.length; if(n<2) return {slope:0,intercept:pts[0]||0}
    const sx=pts.reduce((_,__,i)=>_+i,0),sy=pts.reduce((s,v)=>s+v,0)
    const sxy=pts.reduce((s,v,i)=>s+i*v,0),sx2=pts.reduce((s,_,i)=>s+i*i,0)
    const slope=(n*sxy-sx*sy)/(n*sx2-sx*sx||1)
    return {slope,intercept:(sy-slope*sx)/n}
  },
  predict(pts,n=3) {
    const {slope,intercept}=this.linReg(pts)
    return Array.from({length:n},(_,i)=>Math.max(0,Math.round(slope*(pts.length+i)+intercept)))
  },
  ema(vals,a=0.3) {
    if(!vals.length) return []
    const r=[vals[0]]
    for(let i=1;i<vals.length;i++) r.push(a*vals[i]+(1-a)*r[i-1])
    return r
  },
  anomalies(vals,th=2.0) {
    if(vals.length<3) return vals.map(()=>false)
    const mean=vals.reduce((s,v)=>s+v,0)/vals.length
    const std=Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0)/vals.length)
    return vals.map(v=>std>0?Math.abs((v-mean)/std)>th:false)
  },
  health(cards,txns) {
    if(!cards.length) return 50
    const tl=cards.reduce((s,c)=>s+c.limit,0)
    const tu=cards.reduce((s,c)=>s+txns.filter(t=>t.cardId===c.id).reduce((a,t)=>a+t.amount,0),0)
    const uScore=Math.max(0,40-PCT(tu,tl)*0.4)
    const dScore=Math.min(20,cards.length*8)
    const mx=Math.max(...cards.map(c=>PCT(txns.filter(t=>t.cardId===c.id).reduce((a,t)=>a+t.amount,0),c.limit)),0)
    return Math.min(100,Math.round(uScore+dScore+Math.max(0,40-mx*0.4)))
  },
  monthlyData(txns,n=6) {
    const now=new Date()
    return Array.from({length:n},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-(n-1-i),1)
      const key=MK(d.toISOString())
      const mt=txns.filter(t=>MK(t.date)===key)
      const total=mt.reduce((s,t)=>s+t.amount,0)
      const bycat={}; CATS.forEach(c=>{bycat[c]=mt.filter(t=>t.cat===c).reduce((s,t)=>s+t.amount,0)})
      return {mes:MNAMES[d.getMonth()],total,...bycat}
    })
  },
  predictEnd(txns) {
    const now=new Date(),thisM=MK(now.toISOString())
    const mt=txns.filter(t=>MK(t.date)===thisM)
    const day=now.getDate(),dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate()
    const cur=mt.reduce((s,t)=>s+t.amount,0)
    const daily=day>0?cur/day:0
    const linPred=Math.round(daily*dim)
    const hist=[]
    for(let i=5;i>=1;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);hist.push(txns.filter(t=>MK(t.date)===MK(d.toISOString())).reduce((s,t)=>s+t.amount,0))}
    if(hist.filter(v=>v>0).length>=2){const {slope,intercept}=this.linReg(hist);const tp=Math.max(0,slope*hist.length+intercept);return Math.round(linPred*0.55+tp*0.45)}
    return linPred
  },
  riskMin(cards,txns) {
    const tl=cards.reduce((s,c)=>s+c.limit,0);if(!tl) return 0
    const tu=cards.reduce((s,c)=>s+txns.filter(t=>t.cardId===c.id).reduce((a,t)=>a+t.amount,0),0)
    return Math.min(95,Math.round(PCT(tu,tl)*1.1))
  }
}
