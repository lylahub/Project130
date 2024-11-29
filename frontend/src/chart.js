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
      myChart.destroy();
    }

    myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(balances.owes),
        datasets: [
          {
            label: 'Balance',
            data: Object.values(balances.owes),
            backgroundColor: Object.values(balances.owes).map((value) =>
              value > 0 ? '#94B49F' : '#FCB5AC'
            ),
            borderColor: Object.values(balances.owes).map((value) =>
              value > 0 ? '#94B49F' : '#FCB5AC'
            ),
            borderWidth: 0,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw;
                return value > 0 
                  ? `Owes you: $${Math.abs(value).toFixed(2)}`
                  : `You owe: $${Math.abs(value).toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              callback: function(value, index, values) {
                // 判斷數值的正負號並相應顯示
                const isNegative = value < 0;
                // 因為資料是反向的，所以要反過來顯示正負號
                const displayValue = isNegative ? -Math.abs(value) : Math.abs(value);
                return '$' + displayValue.toFixed(2);
              },
              font: {
                size: 12
              }
            },
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12
              }
            }
          }
        }
      }
    });

    return () => {
      if (myChart) myChart.destroy();
    };
  }, [balances]);

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <canvas ref={chartRef} />
    </div>
  );
};

const generateColors = (count) => {
    // 定義你想要的顏色
  const colorPalette = [
    '#D4B499',   // 暖棕色
    '#C7BEA2',   // 淺卡其
    '#AAA492',   // 灰褐色
    '#9A9483',   // 深灰褐
    '#A49592',   // 玫瑰灰
    '#B4A397',   // 淺咖啡
    '#CDC3BD',   // 灰粉
    '#A7AAA4'    // 冷灰色
  ];

  // 如果類別數量超過顏色數量，就循環使用
  return Array(count).fill().map((_, i) => colorPalette[i % colorPalette.length]);
};

  const CategoryChartExpense = ({ categories, transactions }) => {
    const title = "Expense Overview"
    const chartRef = useRef(null);
    let myChart = null;
    
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
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              display: true,
            },
            title: {
              display: true,
              text: title,
              font: {
                size: 16
              }
            }
          },
        },
      });
  
      return () => {
        if (myChart) myChart.destroy();
      };
    }, [categories, transactions]);
  
    return <canvas ref={chartRef} />;
  };

export { BalancesChart, CategoryChartExpense };
