export const FP = {
  catFrom(name="") {
    const n=name.toLowerCase()
    if(/rest|food|mcdonald|burger|kfc|pizza|sushi|pollo|taco|café|cafe|restaur|comida|andrés|andres|gourmet/.test(n)) return "Restaurantes"
    if(/éxito|exito|carulla|jumbo|supermer|alkosto|ara\b|d1\b|market|superk|olimpica|olímpica/.test(n)) return "Supermercado"
    if(/uber|didi|taxi|cabify|indrive|transm|metro|bus\b|parking|peaje|gasolina|bp\b|esso|combustible/.test(n)) return "Transporte"
    if(/netflix|spotify|amazon|apple\s?tv|google\s?play|youtube|hbo|disney|prime\s?video|xbox|steam|deezer|tidal/.test(n)) return "Suscripciones"
    if(/farmac|drogu|médico|medico|clínica|clinica|hospital|salud|eps|medicina|doctor|laborat/.test(n)) return "Salud"
    if(/avianca|latam|vivacol|hotel|marriott|airbnb|booking|despegar|viaje|aeropuerto/.test(n)) return "Viajes"
    if(/zara|h&m|nike|adidas|decathlon|forever\s?21|ropa|moda|falabella|arturo\s?calle|tennis|bershka/.test(n)) return "Ropa"
    if(/cine|teatro|boleter|parque|entrad|concierto|estadio|movie|netflix|disney/.test(n)) return "Entretenimiento"
    if(/claro|movistar|tigo|epm|etb|codensa|gas\s?natural|aguas|servicio|public/.test(n)) return "Servicios"
    if(/apple\s?store|samsung|pc|tecnolog|celular|laptop|computador|dell|hp\b|lenovo/.test(n)) return "Tecnología"
    if(/universidad|colegio|curso|udemy|platzi|educaci|sena\b/.test(n)) return "Educación"
    return "Otros"
  },
  parseAmt(v) {
    if(typeof v==="number") return Math.abs(v)
    const s=String(v||"").replace(/[$\sCOP]/gi,"")
    const dots=s.split(".").length-1,commas=s.split(",").length-1
    let clean=s
    if(dots>1) clean=s.replace(/\./g,"").replace(",",".")
    else if(commas>1) clean=s.replace(/,/g,"")
    else if(dots===1&&commas===1) clean=s.indexOf(".")>s.indexOf(",")?s.replace(",",""):s.replace(".","").replace(",",".")
    else if(dots===1) clean=s
    else if(commas===1) clean=s.replace(",",".")
    const n=parseFloat(clean)
    return isNaN(n)?0:Math.abs(n)
  },
}
