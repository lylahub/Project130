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

const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * (360 / count)) % 360;
      const saturation = 70; 
      const lightness = 50; 
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
  };

  const CategoryChartExpense = ({ categories, transactions }) => {
    const title = "Expense Overview"
    const chartRef = useRef(null);
    let myChart = null;
    console.log("Category data and transaction data passed in:", categories, transactions);
    useEffect(() => {
      const categoryTotals = categories.map((category) => {
        const total = transactions
          .filter((transaction) => transaction.categoryId === category.id && transaction.type === 'expense')
          .reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
        return {
          name: category.name,
          total,
        };
      });
  
      const filteredCategories = categoryTotals.filter((category) => category.total > 0);
      const backgroundColors = generateColors(filteredCategories.length);
  
      const data = {
        labels: filteredCategories.map((category) => category.name),
        datasets: [
          {
            data: filteredCategories.map((category) => category.total),
            backgroundColor: backgroundColors,
            borderWidth: 1,
          },
        ],
      };
  
      const ctx = chartRef.current.getContext('2d');
      if (myChart) {
        myChart.destroy();
      }
  
      myChart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
          },
        },
      });

      return () => {
        if (myChart) myChart.destroy();
      };
    }, [categories, transactions]);
  
    return (
        <div className="chart-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            {title && <h3 style={{ marginBottom: '10px', textAlign: 'center' }}>{title}</h3>}
            <canvas ref={chartRef} style={{ width: '300px', height: '300px' }} />
        </div>);
  };

export { BalancesChart, CategoryChartExpense };
