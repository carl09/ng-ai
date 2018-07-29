import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as tinycolor from 'tinycolor2';
import { createGraphDefaults } from '../services/graph.utils';
import {
  LightOrDarkService,
  RGB,
  TrainingData,
} from '../services/light-or-dark.service';
import { LightOrDarkService2 } from '../services/light-or-dark2.service';

@Component({
  selector: 'app-light-or-dark',
  templateUrl: './light-or-dark.component.html',
  styleUrls: ['./light-or-dark.component.css'],
  providers: [LightOrDarkService2],
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
    '#a40e3b',
    '#cc4146',
    '#ccc03d',
    '#cc62c3',
    '#4755cc',
    '#ed8f13',
    '#8645cc',
    '#47a6cc',
    '#39cc40',
    '#6c749f',
    '#5622d1',
    '#dba91a',
    '#a1d656',
    '#f58771',
  ];

  private trainData: TrainingData[] = [];

  constructor(
    private lightOrDarkService2: LightOrDarkService2,
    private lightOrDarkService: LightOrDarkService,
  ) {}

  public ngOnInit() {
    console.log('Oninit');
    this.chart1 = createGraphDefaults(this.canvas1, 'accuracy curve');

    this.chart1.data.datasets.push({
      borderColor: '#3cba9f',
      fill: false,
      label: 'accuracy',
    });

    this.chart1.data.datasets.push({
      borderColor: '#6d30ae',
      fill: false,
      label: 'old accuracy',
    });

    this.chart1.update();

    this.chart2 = createGraphDefaults(this.canvas2, 'loss curve');

    this.chart2.data.datasets.push({
      borderColor: '#ff0000',
      fill: false,
      label: 'loss',
    });

    this.chart2.data.datasets.push({
      borderColor: '#ff696d',
      fill: false,
      label: 'old loss',
    });

    this.chart2.update();

    this.lightOrDarkService2.load().then(() => {
      const data = localStorage.getItem('trainData');
      if (data) {
        this.trainData = JSON.parse(data) || [];

        this.lightOrDarkService2
          .train(101, this.trainData, (e, l) => {
            this.updateGraph(e, l);
            this.updateDisplay();
          })
          .then(() => {
            this.newColor = this.getRandomRgb();
            this.colorChanged(this.newColor);
            this.updateDisplay();
          });

        this.lightOrDarkService.load().then(() => {
          this.lightOrDarkService
            .train(101, this.trainData, (e, l) => {
              this.updateGraph(e, l, 1);
            })
            .then(() => {});
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

    this.lightOrDarkService2.guess(rgb).then(x => {
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

    this.lightOrDarkService2
      .train(10, this.trainData, (e, l) => this.updateGraph(e, l))
      .then(() => {
        localStorage.setItem('trainData', JSON.stringify(this.trainData));
        this.newColor = tinycolor.random().toHexString();
        this.colorChanged(this.newColor);
        this.updateDisplay();
      });
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

      this.lightOrDarkService2.guessList(colors).then((r: number[]) => {
        r.forEach((i, index) => {
          this.guesslist[colors[index]] = i === 1 ? 'white' : 'black';
        });
        console.log(x);
      });

      return colors;
    });
  }

  private updateGraph(e, l, num: number = 0) {
    if (num === 0) {
      this.chart1.data.labels.push(e.toString());
      this.chart2.data.labels.push(e.toString());
    }

    const acc = Math.round(l.acc * 100000) / 100000;

    (this.chart1.data.datasets[num].data as number[]).push(acc);
    (this.chart2.data.datasets[num].data as number[]).push(l.loss);

    this.chart1.update();
    this.chart2.update();
  }
}
