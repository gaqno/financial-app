import type { IProjection } from '../types/investments';

// Taxas de referência (simuladas - em produção viriam de API)
export const REFERENCE_RATES = {
  CDI: 11.75, // % ao ano
  SELIC: 11.25, // % ao ano
  IPCA: 4.50 // % ao ano
};

// Tabela de IR regressiva para renda fixa
export const IR_RATES = {
  0: 0.225,    // até 180 dias: 22,5%
  180: 0.20,   // de 181 a 360 dias: 20%
  360: 0.175,  // de 361 a 720 dias: 17,5%
  720: 0.15    // acima de 720 dias: 15%
};

// Intervalos de tempo para projeções
export const PROJECTION_INTERVALS = [
  { key: '1m', label: '1 Mês', days: 30 },
  { key: '3m', label: '3 Meses', days: 90 },
  { key: '6m', label: '6 Meses', days: 180 },
  { key: '1a', label: '1 Ano', days: 365 },
  { key: '2a', label: '2 Anos', days: 730 },
  { key: '3a', label: '3 Anos', days: 1095 },
  { key: '5a', label: '5 Anos', days: 1825 }
];

// Calcular número de dias entre duas datas
export function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calcular rendimento de CDB/CDI
export function calculateCDBYield(
  principal: number,
  ratePercentage: number, // Porcentagem do CDI (ex: 120 para 120% do CDI)
  days: number,
  cdiRate: number = REFERENCE_RATES.CDI
): number {
  const dailyRate = (cdiRate * (ratePercentage / 100)) / 100 / 365;
  return principal * Math.pow(1 + dailyRate, days) - principal;
}

// Calcular rendimento do Tesouro Selic
export function calculateSelicYield(
  principal: number,
  days: number,
  selicRate: number = REFERENCE_RATES.SELIC
): number {
  const dailyRate = selicRate / 100 / 365;
  return principal * Math.pow(1 + dailyRate, days) - principal;
}

// Calcular rendimento do Tesouro Prefixado
export function calculateFixedYield(
  principal: number,
  annualRate: number, // Taxa anual fixa em %
  days: number
): number {
  const dailyRate = annualRate / 100 / 365;
  return principal * Math.pow(1 + dailyRate, days) - principal;
}

// Calcular rendimento do Tesouro IPCA+
export function calculateIPCAYield(
  principal: number,
  fixedRate: number, // Taxa fixa anual
  days: number,
  ipcaRate: number = REFERENCE_RATES.IPCA
): number {
  const totalRate = fixedRate + ipcaRate;
  const dailyRate = totalRate / 100 / 365;
  return principal * Math.pow(1 + dailyRate, days) - principal;
}

// Calcular Imposto de Renda
export function calculateIncomeTax(yieldAmount: number, days: number): number {
  let rate = IR_RATES[0]; // 22.5% default
  
  if (days > 720) rate = IR_RATES[720];
  else if (days > 360) rate = IR_RATES[360];
  else if (days > 180) rate = IR_RATES[180];
  
  return yieldAmount * rate;
}

// Calcular IOF (apenas primeiros 30 dias)
export function calculateIOF(yieldAmount: number, days: number): number {
  if (days > 30) return 0;
  
  const iofRate = (30 - days) / 30 * 0.01; // 1% regressivo
  return yieldAmount * iofRate;
}

// Calcular valor líquido (bruto - IR - IOF)
export function calculateNetValue(
  grossValue: number,
  yieldAmount: number,
  days: number
): number {
  const ir = calculateIncomeTax(yieldAmount, days);
  const iof = calculateIOF(yieldAmount, days);
  return grossValue - ir - iof;
}

// Calcular rentabilidade percentual
export function calculateReturnPercentage(
  initialAmount: number,
  currentAmount: number
): number {
  return ((currentAmount - initialAmount) / initialAmount) * 100;
}

// Calcular rentabilidade anualizada
export function calculateAnnualizedReturn(
  initialAmount: number,
  currentAmount: number,
  days: number
): number {
  const totalReturn = currentAmount / initialAmount;
  const years = days / 365;
  return (Math.pow(totalReturn, 1 / years) - 1) * 100;
}

// Comparar performance com benchmark (CDI)
export function calculateBenchmarkComparison(
  investmentReturn: number,
  days: number,
  benchmarkRate: number = REFERENCE_RATES.CDI
): number {
  const benchmarkReturn = calculateSelicYield(10000, days, benchmarkRate) / 10000 * 100;
  return investmentReturn - benchmarkReturn;
}

// Calcular valor atual do investimento
export function calculateCurrentValue(
  initialAmount: number,
  yieldType: string,
  yieldRate: number,
  startDate: string,
  endDate: string = new Date().toISOString().split('T')[0]
): { currentAmount: number; yieldAmount: number; days: number } {
  const days = calculateDaysBetween(startDate, endDate);
  let yieldAmount = 0;

  switch (yieldType) {
    case 'CDI_PERCENTAGE':
      yieldAmount = calculateCDBYield(initialAmount, yieldRate, days);
      break;
    case 'SELIC_PERCENTAGE':
      yieldAmount = calculateSelicYield(initialAmount, days);
      break;
    case 'PERCENTAGE':
      yieldAmount = calculateFixedYield(initialAmount, yieldRate, days);
      break;
    case 'FIXED':
      yieldAmount = (yieldRate / 100) * initialAmount * (days / 365);
      break;
    default:
      yieldAmount = 0;
  }

  return {
    currentAmount: initialAmount + yieldAmount,
    yieldAmount,
    days
  };
}

// 🚀 NOVA FUNCIONALIDADE: Calcular projeções de rendimento
export function calculateProjections(
  currentAmount: number,
  yieldType: string,
  yieldRate: number,
  intervals: typeof PROJECTION_INTERVALS = PROJECTION_INTERVALS
): IProjection[] {
  const projections: IProjection[] = [];

  intervals.forEach(interval => {
    let yieldAmount = 0;

    // Calcular rendimento bruto baseado no tipo
    switch (yieldType) {
      case 'CDI_PERCENTAGE':
        yieldAmount = calculateCDBYield(currentAmount, yieldRate, interval.days);
        break;
      case 'SELIC_PERCENTAGE':
        yieldAmount = calculateSelicYield(currentAmount, interval.days);
        break;
      case 'PERCENTAGE':
        yieldAmount = calculateFixedYield(currentAmount, yieldRate, interval.days);
        break;
      case 'FIXED':
        yieldAmount = (yieldRate / 100) * currentAmount * (interval.days / 365);
        break;
      default:
        yieldAmount = 0;
    }

    const grossValue = currentAmount + yieldAmount;
    const irAmount = calculateIncomeTax(yieldAmount, interval.days);
    const iofAmount = calculateIOF(yieldAmount, interval.days);
    const netValue = grossValue - irAmount - iofAmount;
    const netYield = netValue - currentAmount;
    const yieldPercentage = currentAmount > 0 ? (netYield / currentAmount) * 100 : 0;
    const annualizedReturn = calculateAnnualizedReturn(currentAmount, netValue, interval.days);

    projections.push({
      period: interval.label,
      days: interval.days,
      grossValue,
      yieldAmount,
      irAmount,
      iofAmount,
      netValue,
      netYield,
      yieldPercentage,
      annualizedReturn
    });
  });

  return projections;
}

// 📈 Calcular projeção para um investimento específico
export function calculateInvestmentProjections(
  investment: any,
  intervals: typeof PROJECTION_INTERVALS = PROJECTION_INTERVALS
): IProjection[] {
  return calculateProjections(
    investment.currentAmount,
    investment.yieldType,
    investment.yieldRate,
    intervals
  );
}

// 📊 Calcular projeção da carteira total
export function calculatePortfolioProjections(
  investments: any[],
  intervals: typeof PROJECTION_INTERVALS = PROJECTION_INTERVALS
): IProjection[] {
  const portfolioProjections: IProjection[] = [];

  intervals.forEach(interval => {
    let totalGrossValue = 0;
    let totalYieldAmount = 0;
    let totalIrAmount = 0;
    let totalIofAmount = 0;
    let totalCurrentAmount = 0;

    // Somar projeções de todos os investimentos
    investments.forEach(investment => {
      const projection = calculateProjections(
        investment.currentAmount,
        investment.yieldType,
        investment.yieldRate,
        [interval]
      )[0];

      totalCurrentAmount += investment.currentAmount;
      totalGrossValue += projection.grossValue;
      totalYieldAmount += projection.yieldAmount;
      totalIrAmount += projection.irAmount;
      totalIofAmount += projection.iofAmount;
    });

    const netValue = totalGrossValue - totalIrAmount - totalIofAmount;
    const netYield = netValue - totalCurrentAmount;
    const yieldPercentage = totalCurrentAmount > 0 ? (netYield / totalCurrentAmount) * 100 : 0;
    const annualizedReturn = calculateAnnualizedReturn(totalCurrentAmount, netValue, interval.days);

    portfolioProjections.push({
      period: interval.label,
      days: interval.days,
      grossValue: totalGrossValue,
      yieldAmount: totalYieldAmount,
      irAmount: totalIrAmount,
      iofAmount: totalIofAmount,
      netValue,
      netYield,
      yieldPercentage,
      annualizedReturn
    });
  });

  return portfolioProjections;
}

// Gerar dados históricos simulados para gráficos
export function generateHistoricalData(
  investment: any,
  months: number = 12
): { date: string; value: number }[] {
  const data = [];
  const startDate = new Date(investment.startDate);
  const initialAmount = investment.initialAmount;

  for (let i = 0; i <= months; i++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + i);
    
    const dateStr = currentDate.toISOString().split('T')[0];
    const { currentAmount } = calculateCurrentValue(
      initialAmount,
      investment.yieldType,
      investment.yieldRate,
      investment.startDate,
      dateStr
    );

    data.push({
      date: dateStr,
      value: currentAmount
    });
  }

  return data;
} 