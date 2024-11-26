import React, { useRef, useEffect } from 'react';
import {
  Chart,
  registerables
} from 'chart.js';

Chart.register(...registerables);

//chart for group budget: bar
const BalancesChart = ({ balances }) => {
  const chartRef = useRef(null);
  let myChart = null;

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');
    if (myChart) {
      myChart.destroy(); //destroy the chart if already existed
    }
    myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(balances.owes),
        datasets: [
          {
            label: 'Debt situation',
            data: Object.values(balances.owes),
            //if anyone owes me money, green, otherwise red
            backgroundColor: Object.values(balances.owes).map((value) =>
                value > 0 ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132, 0.2)'
                ),
                borderColor: Object.values(balances.owes).map((value) =>
                value > 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
                ),

            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      if (myChart) myChart.destroy(); // 清理图表实例
    };
  }, [balances]);

  return <canvas ref={chartRef} />;
};


const CategoriesChart = async( {cateogries, transactions, type} ) => {
    const chartRef = useRef(null);
    let myChart = null;

    useEffect(() => {
        const ctx = chartRef.current.getContext('2d');
        if (myChart) {
            myChart.destroy(); //destroy the chart if already existed
          }

          const filteredTransactions = transactions.filter(
            (transaction) => transaction.incomeExpense === type
          );

    });


}

export { BalancesChart };
