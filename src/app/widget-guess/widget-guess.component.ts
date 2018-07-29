import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Chart } from 'chart.js';
import { EmbeddingModelService } from './embedding-model.service';
import { EncoderModelService } from './encoder-model.service';
import { IFormItem, WidgetDataService } from './widget-data.service';

@Component({
  styleUrls: ['./widget-guess.component.scss'],
  selector: 'app-widget-guess',
  templateUrl: './widget-guess.component.html',
  preserveWhitespaces: false,
  providers: [WidgetDataService, EmbeddingModelService, EncoderModelService],
})
export class WidgetGuessComponent implements OnInit {
  public items: IFormItem[] = [];

  public untrained: string[] = [];

  @ViewChild('canvas1') canvas1: ElementRef;
  @ViewChild('canvas2') canvas2: ElementRef;

  public chart1: Chart;
  public chart2: Chart;

  public guessed = [];

  public widgets: string[] = [
    'boolean',
    'datetime',
    'multilinetext',
    'number',
    'textbox',
    'hyperlink',
    'email',
    'file-upload',
  ];

  public profileForm = new FormGroup({
    name: new FormControl(''),
    widget: new FormControl(''),
  });

  constructor(
    private widgetDataService: WidgetDataService,
    private embeddingModelService: EmbeddingModelService,
    private encoderModelService: EncoderModelService,
  ) {}

  public ngOnInit() {
    const ctx1 = this.canvas1.nativeElement.getContext('2d');
    const ctx2 = this.canvas2.nativeElement.getContext('2d');

    this.chart1 = new Chart(ctx1, {
      type: 'line',
      data: {
        datasets: [
          {
            borderColor: '#3cba9f',
            fill: false,
            label: 'accuracy',
          },
        ],
      },
      options: {
        title: {
          text: 'accuracy curve',
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

    this.chart2 = new Chart(ctx2, {
      type: 'line',
      data: {
        datasets: [
          {
            borderColor: '#FF0000',
            fill: false,
            label: 'loss',
          },
        ],
      },
      options: {
        title: {
          text: 'loss curve',
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

    this.createModel();
  }

  public async createModel() {
    this.items = this.widgetDataService.items();

    this.untrained = [];
    this.guessed = [];

    await this.encoderModelService.createModel(this.items, this.widgets);

    await this.encoderModelService.train(this.items, this.widgets, (e, l) => {
      this.chart1.data.labels.push(e.toString());
      this.chart2.data.labels.push(e.toString());

      (this.chart1.data.datasets[0].data as number[]).push(l.acc);
      (this.chart2.data.datasets[0].data as number[]).push(l.loss);

      this.chart1.update();
      this.chart2.update();
    });

    const results = this.encoderModelService.guess(this.items, this.widgets);

    this.guessed = this.items.map((v, i) => {
      return {
        name: v.name,
        widget: v.widget,
        guess1: results[i].widget,
        trained: true,
      };
    });

    // await this.embeddingModelService.createModel(this.items, this.widgets);
    // await this.embeddingModelService.train(this.items, this.widgets);

    // const results = this.embeddingModelService.guess(this.items, this.widgets);

    // this.guessed = this.items.map((v, i) => {
    //   return {
    //     name: v.name,
    //     widget: v.widget,
    //     guess1: results[i].widget,
    //   };
    // });
  }

  public guess() {
    this.items = this.widgetDataService.items();

    const results = this.encoderModelService.guess(this.items, this.widgets);

    this.guessed = this.items.map((v, i) => {
      return {
        name: v.name,
        widget: v.widget,
        guess1: results[i].widget,
        trained: this.untrained.indexOf(v.name) === -1,
      };
    });

    // const results = this.embeddingModelService.guess(this.items, this.widgets);

    // this.guessed = this.items.map((v, i) => {
    //   return {
    //     name: v.name,
    //     widget: v.widget,
    //     guess1: results[i].widget,
    //   };
    // });
  }

  public onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.profileForm.value);

    // this.items.push({
    //   name: this.profileForm.value.name,
    //   widget: this.profileForm.value.widget,
    // });

    this.widgetDataService.addItem({
      name: this.profileForm.value.name,
      widget: this.profileForm.value.widget,
    });

    this.untrained.push(this.profileForm.value.name);

    this.guess();

    this.profileForm.reset();
  }
}
