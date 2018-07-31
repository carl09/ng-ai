import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { createGraphDefaults } from '../services/graph.utils';
import { ForcastingService, IForcastingItem } from './forcasting.service';

@Component({
  selector: 'app-forcasting',
  templateUrl: './forcasting.component.html',
  providers: [ForcastingService],
})
export class ForcastingComponent implements OnInit {
  @ViewChild('canvas1')
  canvas1: ElementRef;

  private chart1: Chart;

  constructor(
    private httpClient: HttpClient,
    private forcastingService: ForcastingService,
  ) {}

  public ngOnInit(): void {
    this.chart1 = createGraphDefaults(this.canvas1, 'accuracy curve');

    this.httpClient
      .get(`/assets/forcasting_data.json`)
      .subscribe((x: IForcastingItem[]) => {
        this.forcastingService.createModel(x).then(() => {
          const training = this.forcastingService.getTraining(x);
          const testing = this.forcastingService.getTesting(x);

          this.chart1.data.datasets.push({
            borderColor: '#3cba9f',
            fill: false,
            label: 'actual',
          });

          this.chart1.update();

          testing.forEach(t => {
            this.chart1.data.labels.push(t.index);
            (this.chart1.data.datasets[0].data as number[]).push(t.units_sold);

            this.chart1.update();
          });

          console.log(x.length, training.length, testing.length);

          this.forcastingService
            .train(training, testing, (e, l) => {
              console.log(e, l);
              this.forcastingService.guessSimple(testing[0]);
            })
            .then(() => {
              this.chart1.data.datasets.push({
                borderColor: '#ff696d',
                fill: false,
                label: 'guess',
              });

              this.chart1.update();

              testing.forEach(t => {
                const z = this.forcastingService.guessSimple(t);
                console.log(z);
                (this.chart1.data.datasets[1].data as number[]).push(z);

                this.chart1.update();
              });
            });
        });
      });
  }
}
