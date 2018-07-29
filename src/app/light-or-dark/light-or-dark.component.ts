import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import { from } from 'rxjs';
import { map, take } from 'rxjs/operators';
import * as tinycolor from 'tinycolor2';
import { createGraphDefaults } from '../services/graph.utils';
import {
  LightOrDarkService,
  RGB,
  TrainingData,
} from '../services/light-or-dark.service';

@Component({
  selector: 'app-light-or-dark',
  templateUrl: './light-or-dark.component.html',
  styleUrls: ['./light-or-dark.component.css'],
})
export class LightOrDarkComponent implements OnInit {
  @ViewChild('canvas1') canvas1: ElementRef;
  @ViewChild('canvas2') canvas2: ElementRef;

  public color: string;
  public colorCode: RGB;
  public guessLabel: string;

  public newColor: string;

  public colorMatrix: string[][] = [];

  public guesslist = {};

  public chart1: Chart;
  public chart2: Chart;

  private baseColors: string[] = [
    '#cccccc',
    '#cc4146',
    '#ccc03d',
    '#cc62c3',
    '#4755cc',
    '#ed8f13',
    '#8645cc',
    '#47a6cc',
    '#39cc40',
  ];

  private trainData: TrainingData[] = [];

  constructor(private lightOrDarkService: LightOrDarkService) {}

  public ngOnInit() {
    console.log('Oninit');
    this.chart1 = createGraphDefaults(this.canvas1, 'accuracy curve');

    this.chart1.data.datasets.push({
      borderColor: '#3cba9f',
      fill: false,
      label: 'accuracy',
    });

    this.chart1.update();

    this.chart2 = createGraphDefaults(this.canvas2, 'loss curve');

    this.chart2.data.datasets.push({
      borderColor: '#ff0000',
      fill: false,
      label: 'loss',
    });

    this.chart2.update();

    this.lightOrDarkService.load().then(() => {
      const data = localStorage.getItem('trainData');
      if (data) {
        this.trainData = JSON.parse(data) || [];
        from(
          this.lightOrDarkService.train(100, this.trainData, (e, l) => {
            this.updateGraph(e, l);
            this.updateDisplay();
          }),
        )
          .pipe(take(1))
          .subscribe(() => {
            this.newColor = this.getRandomRgb();
            this.colorChanged(this.newColor);
            this.updateDisplay();
          });
      } else {
        this.newColor = this.getRandomRgb();
        this.colorChanged(this.newColor);
        this.updateDisplay();
      }
    });
  }

  public colorChanged($event: any) {
    this.color = undefined;

    const rgb = tinycolor($event).toRgb();

    console.log('colorChanged', rgb);

    from(this.lightOrDarkService.guess(rgb))
      .pipe(take(1))
      .subscribe(x => {
        if (x) {
          this.guessLabel = 'white';
          console.log('light');
        } else {
          this.guessLabel = 'black';
          console.log('dark');
        }
      });

    this.color = $event;
    this.colorCode = rgb;
  }

  public swap(color: string, fontColor: string) {
    console.log(color, fontColor);
    this.updateAI(tinycolor(color).toRgb(), fontColor === 'black');
  }

  public updateAI(rgb: RGB, isLight: boolean) {
    const data: TrainingData = {
      input: rgb,
      output: {},
    };

    data.output.light = isLight ? 1 : 0;
    data.output.dark = isLight ? 0 : 1;

    console.log({ data });
    this.trainData.push(data);

    this.lightOrDarkService
      .train(10, this.trainData, (e, l) => this.updateGraph(e, l))
      .then(() => {
        localStorage.setItem('trainData', JSON.stringify(this.trainData));
        this.newColor = tinycolor.random().toHexString();
        this.colorChanged(this.newColor);
        this.updateDisplay();
      });
  }

  public saveModel() {
    this.lightOrDarkService.save();
  }

  private getRandomRgb() {
    return tinycolor.random().toHexString();
  }

  private updateDisplay() {
    this.colorMatrix = this.baseColors.map(x => {
      const colors: string[] = [];

      colors.push(
        tinycolor(x)
          .darken(20)
          .toHexString(),
      );
      colors.push(
        tinycolor(x)
          .darken(10)
          .toHexString(),
      );
      colors.push(tinycolor(x).toHexString());
      colors.push(
        tinycolor(x)
          .lighten(10)
          .toHexString(),
      );
      colors.push(
        tinycolor(x)
          .lighten(20)
          .toHexString(),
      );

      from(this.lightOrDarkService.guessList(colors))
        .pipe(take(1))
        .subscribe((r: number[]) => {
          r.forEach((i, index) => {
            this.guesslist[colors[index]] = i === 1 ? 'white' : 'black';
          });
          console.log(x);
          // if (x) {
          //   this.guessLabel = 'white';
          //   console.log('light');
          // } else {
          //   this.guessLabel = 'black';
          //   console.log('dark');
          // }
        });

      return colors;
    });
  }

  private updateGraph(e, l) {
    this.chart1.data.labels.push(e.toString());
    this.chart2.data.labels.push(e.toString());

    const acc = Math.round(l.acc * 100000) / 100000;

    (this.chart1.data.datasets[0].data as number[]).push(acc);
    (this.chart2.data.datasets[0].data as number[]).push(l.loss);

    this.chart1.update();
    this.chart2.update();
  }
}
