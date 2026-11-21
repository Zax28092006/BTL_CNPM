const MAU_BIEU_DO = ['#1C1A17', '#B68B4C', '#8C7355', '#A3998C', '#D6CEC2'];

// Đồng bộ font chữ hệ thống cho biểu đồ Chart.js
if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Be Vietnam Pro', sans-serif";
}

document.addEventListener('DOMContentLoaded', function () {
    const viewButtons = document.querySelectorAll('.btn-view-mode');
    const tableContainer = document.getElementById('tableContainer');
    const chartContainer = document.getElementById('chartContainer');

    viewButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const mode = this.dataset.view;

            if (mode === 'table') {
                if (tableContainer) {
                    tableContainer.classList.remove('d-none');
                    tableContainer.className = 'col-12';
                }
                if (chartContainer) {
                    chartContainer.classList.add('d-none');
                }
            } else if (mode === 'chart') {
                if (tableContainer) {
                    tableContainer.classList.add('d-none');
                }
                if (chartContainer) {
                    chartContainer.classList.remove('d-none');
                    chartContainer.className = 'col-12';
                }
            } else {
                if (tableContainer) {
                    tableContainer.classList.remove('d-none');
                    tableContainer.className = 'col-lg-7';
                }
                if (chartContainer) {
                    chartContainer.classList.remove('d-none');
                    chartContainer.className = 'col-lg-5';
                }
            }
        });
    });
});

function renderRevenueChart(canvasId, labels, dataValues) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: MAU_BIEU_DO.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#FFFFFF'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: "'Be Vietnam Pro', sans-serif",
                            size: 13
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const val = context.raw || 0;
                            return ' ' + context.label + ': ' + Number(val).toLocaleString('vi-VN') + ' đ';
                        }
                    }
                }
            }
        }
    });
}

function renderDensityChart(canvasId, labels, dataValues) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số ngày thuê',
                data: dataValues,
                backgroundColor: '#1C1A17',
                hoverBackgroundColor: '#B68B4C',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ' Đã thuê: ' + context.raw + ' ngày';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            family: "'Be Vietnam Pro', sans-serif"
                        }
                    },
                    grid: {
                        color: 'rgba(28, 26, 23, 0.06)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: "'Be Vietnam Pro', sans-serif"
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
