export const renderMoney = (price: number | null) => {
  if (price === null) {
    return false
  }
  const formatter = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    // useGrouping: true,
  })

  return formatter.format(price / 100)
}