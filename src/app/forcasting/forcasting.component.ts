import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { createGraphDefaults } from '../services/graph.utils';
import { ForcastingConvService } from './forcasting-conv.service';
import { ForcastingService, IForcastingItem } from './forcasting.service';

@Component({
  selector: 'app-forcasting',
  templateUrl: './forcasting.component.html',
  providers: [ForcastingService, ForcastingConvService],
})
export class ForcastingComponent implements OnInit {
  @ViewChild('canvas1')
  canvas1: ElementRef;

  private chart1: Chart;

  constructor(
    private httpClient: HttpClient,
    private forcastingService: ForcastingService,
    private forcastingConvService: ForcastingConvService,
  ) {}

  public ngOnInit(): void {
    this.chart1 = createGraphDefaults(this.canvas1, 'accuracy curve');

    this.httpClient.get(`/assets/forcasting_data.json`).subscribe((x: IForcastingItem[]) => {
      x.forEach((z, i) => {
        z.id = i;
      });

      const graphData = this.forcastingService.getTesting(x);

      this.chart1.data.datasets.push({
        borderColor: '#3cba9f',
        fill: false,
        label: 'actual',
      });

      this.chart1.update();

      graphData.forEach(t => {
        this.chart1.data.labels.push(t.index);
        (this.chart1.data.datasets[0].data as number[]).push(t.units_sold);

        this.chart1.update();
      });

      this.forcastingConvService.createModel(x).then(() => {
        const training = this.forcastingConvService.getTraining(x);
        const testing = this.forcastingConvService.getTesting(x);

        console.log('training', training);
        console.log('testing', testing);

        this.chart1.data.datasets.push({
          borderColor: '#ff696d',
          fill: false,
          label: 'guess',
        });

        this.chart1.update();

        graphData.forEach(t => {
          (this.chart1.data.datasets[1].data as number[]).push(0);
          this.chart1.update();
        });

        this.forcastingConvService
          .train(training, testing) // , (e, l) => {
          .then(() => {
            const chartIndex = this.chart1.data.datasets.push({
              borderColor: '#ff696d',
              fill: false,
              label: 'guess',
            });

            this.chart1.update();

            const simpleTestData = this.forcastingConvService.getTestingSample(x);

            console.log(simpleTestData[0]);

            const firstSample = x.findIndex(y => y.id === simpleTestData[0].id) - 1;

            const inner: number[][] = [];

            const guessResult: Array<{ id: number; units_sold: number; temperature: number }> = [];

            for (let index = firstSample; index < x.length; index++) {
              if (inner.length === 0) {
                inner.push(this.forcastingConvService.toX(x[index - 5]));
                inner.push(this.forcastingConvService.toX(x[index - 4]));
                inner.push(this.forcastingConvService.toX(x[index - 3]));
                inner.push(this.forcastingConvService.toX(x[index - 2]));
                inner.push(this.forcastingConvService.toX(x[index - 1]));
                inner.push(this.forcastingConvService.toX(x[index]));
              } else {
                inner.shift();

                const lastGuess = guessResult[guessResult.length - 1];

                const forcastingItem: IForcastingItem = {
                  id: lastGuess.id,
                  units_sold: lastGuess.units_sold,
                  temperature: lastGuess.temperature,

                  index: x[index].index,
                  discount: x[index].discount,
                  placement: x[index].placement,
                  // temperature: x[index].temperature,

                  competing_brand_discount: x[index].competing_brand_discount, // ? 1 : 0,
                };

                inner.push(this.forcastingConvService.toX(forcastingItem));

                // nothing yet
              }

              const nextDay = this.forcastingConvService.guessSimple(inner);

              if (index < x.length - 1) {
                console.log(
                  x[index + 1].temperature,
                  nextDay[0],
                  x[index + 1].units_sold,
                  nextDay[nextDay.length - 1],
                );

                guessResult.push({
                  id: x[index + 1].id,
                  units_sold: nextDay[nextDay.length - 1],
                  temperature: nextDay[0],
                });
              }
            }

            // debugger;

            graphData.forEach((t, i) => {
              const guessIndex = guessResult.findIndex(z => z.id === t.id);

              this.chart1.data.datasets[chartIndex - 1].data[i] =
                guessResult[guessIndex].units_sold;

              // (this.chart1.data.datasets[1].data as number[]).push(
              //   guessResult[guessIndex].units_sold,
              // );
              this.chart1.update();
            });

            // console.log(x[foo], x[foo + 1]);

            // const z = this.forcastingConvService.guessSimple(inner);
            // console.log(this.forcastingConvService.toX(x[firstSample + 1]), z);
            //   this.chart1.data.datasets[1].data[i] = z;
            //   this.chart1.update();
            // });
          });
      });

      this.forcastingService.createModel(x).then(() => {
        const training = this.forcastingService.getTraining(x);
        const testing = this.forcastingService.getTesting(x);

        this.forcastingService
          .train(training, testing) // , (e, l) => {
          .then(() => {
            const index = this.chart1.data.datasets.push({
              borderColor: '#696dff',
              fill: false,
              label: 'guess with known data',
            });

            this.chart1.update();

            testing.forEach((t, i) => {
              const z = this.forcastingService.guessSimple(t);
              this.chart1.data.datasets[index - 1].data[i] = z;
              this.chart1.update();
            });
          });
      });
    });
  }
}
