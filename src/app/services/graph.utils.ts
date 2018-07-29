import { ElementRef } from '@angular/core';
import { Chart } from 'chart.js';

export function createGraphDefaults(
  elementRef: ElementRef,
  title: string,
): Chart {
  // debugger;
  return new Chart(elementRef.nativeElement.getContext('2d'), {
    type: 'line',
    data: {
      //   datasets: [
      //     {
      //       borderColor: '#3cba9f',
      //       fill: false,
      //       label: 'accuracy',
      //     },
      //   ],
    },
    options: {
      title: {
        text: title,
      },
      legend: {
        display: false,
      },
      scales: {
        xAxes: [
          {
            display: false,
          },
        ],
        yAxes: [
          {
            display: true,
          },
        ],
      },
    },
  });
}
