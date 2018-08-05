import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { IForcastingItem } from './forcasting.service';

@Injectable()
export class ForcastingConvService {
  private model: tf.Sequential;

  private placementFactors: string[];

  private daySpendFactor: number[];
  // private monthFactors: string[];

  constructor() {}

  public async createModel(items: IForcastingItem[]) {
    this.placementFactors = items
      .map(x => x.placement)
      .filter((value, index, self) => self.indexOf(value) === index);

    const days: number[] = [0, 0, 0, 0, 0, 0, 0];

    items.forEach(x => {
      const d = new Date(x.index);
      days[d.getDay()] = days[d.getDay()] + x.units_sold;
    });

    const max_day = Math.max(...days); // 4
    const min_day = Math.min(...days); // 1

    this.daySpendFactor = days.map(x => {
      // return this.map(x, min_day / 2, max_day * 2, 0, 1); // Math.round(this.map(x, min_day / 2, max_day * 2, 0, 1) * 100);
      return Math.round(this.map(x, min_day, max_day, 0, 1) * 100);
    });

    console.log(
      'monthFactors, placementItems ',
      // this.monthFactors,
      days,
      this.daySpendFactor,
      this.placementFactors,
    );

    this.model = tf.sequential();

    this.model.add(
      tf.layers.conv1d({
        inputShape: [6, 7],
        kernelSize: 5,
        filters: 8,
        strides: 1,
        activation: 'relu',
        useBias: true,
        kernelInitializer: 'varianceScaling', // tf.initializers.varianceScaling({scale: 3, mode: }),
      }),
    );

    // this.model.add(tf.layers.maxPooling1d({poolSize: 2, strides: 2}));

    // this.model.add(
    //   tf.layers.conv1d({
    //     // inputShape: [6, 7],
    //     kernelSize: 5,
    //     filters: 8,
    //     strides: 1,
    //     activation: 'relu',
    //     kernelInitializer: 'varianceScaling',
    //   }),
    // );

    // this.model.add(tf.layers.maxPooling1d({poolSize: 2, strides: 2}));

    this.model.add(tf.layers.flatten());

    this.model.add(
      tf.layers.dense({
        useBias: true,
        units: 4,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
        // kernelInitializer: tf.initializers.constant({
        //   value: 0.2,
        // }),
      }),
    );

    // this.model.add(tf.layers.dropout({rate: 0.1}));

    this.model.add(
      tf.layers.dense({
        units: 2, // 7,
        activation: 'relu',
        kernelInitializer: tf.initializers.constant({
          value: 0.2,
        }),
      }),
    );

    // const modelOptimizer = tf.train.adamax(0.1);
    const modelOptimizer = tf.train.adam(0.01);
    this.model.compile({
      loss: 'meanSquaredError', // 'meanSquaredError',
      optimizer: modelOptimizer,
      // metrics: ['accuracy'],
    });

    this.model.summary();
  }

  public async train(
    training: { data: number[][][]; labels: number[] },
    testing: { data: number[][][]; labels: number[] },
    callback?: (epoch: number, logs: tf.Logs) => void,
  ) {
    // const data_xs = training.map(x => this.toX(x));

    // const test_data_xs = testing.map(x => this.toX(x));

    const xs = tf.tensor3d(training.data);
    const test_xs = tf.tensor3d(testing.data);

    // const labels_ts: number[] = training.map(f => {
    //   return f.units_sold;
    // });

    // const test_labels_ts: number[] = testing.map(f => {
    //   return f.units_sold;
    // });
    const ys = tf.tensor2d(training.labels);
    const test_ys = tf.tensor2d(testing.labels);

    /// console.log('training', { data_xs, labels_ts });

    const epochs = 100;
    const sampleRate = epochs > 10 ? Math.floor(epochs / 10) : 1;

    const configCallbacks: tf.CustomCallbackConfig = {
      // onBatchEnd: () => (callback ? tf.nextFrame() : Promise.resolve()),
      onEpochEnd: (epoch: number, logs: tf.Logs) => {
        if (callback) {
          if (epoch % sampleRate === 0) {
            callback(epoch, logs);
          }
          return tf.nextFrame();
        }

        if (epoch % sampleRate === 0) {
          console.log('onEpochEnd', epoch, logs);
        }

        return Promise.resolve();
      },
    };
    const config: tf.ModelFitConfig = {
      epochs,
      shuffle: true,
      callbacks: configCallbacks,
      validationData: [test_xs, test_ys],
    };

    await this.model.fit(xs, ys, config);

    xs.dispose();
    ys.dispose();

    test_xs.dispose();
    test_ys.dispose();
  }

  public guessSimple(data: number[][]): number[] {
    const xs = tf.tensor3d([data]);

    const guessResult = this.model.predict(xs) as tf.Tensor;
    const r = guessResult.dataSync() as Float32Array;
    xs.dispose();
    guessResult.dispose();
    // console.log(r)
    return Array.from(r);
  }

  public getTraining(items: IForcastingItem[]): { data: number[][][]; labels: number[] } {
    const filter = items.filter(x => !x.index.startsWith('2017'));

    const data = [];
    const labels = [];

    for (let i = 5; i < filter.length - 1; i++) {
      const inner = [];

      inner.push(this.toX(filter[i - 5]));
      inner.push(this.toX(filter[i - 4]));
      inner.push(this.toX(filter[i - 3]));
      inner.push(this.toX(filter[i - 2]));
      inner.push(this.toX(filter[i - 1]));
      inner.push(this.toX(filter[i]));

      // const l = [ ...this.toX(filter[i + 1]), filter[i + 1].units_sold];
      const l = [filter[i + 1].temperature, filter[i + 1].units_sold];
      // l.shift()
      labels.push(l);

      data.push(inner);
    }

    return {
      data,
      labels,
    };
  }

  public getTesting(items: IForcastingItem[]): { data: number[][][]; labels: number[] } {
    const filter = items.filter(x => x.index.startsWith('2017'));

    const firstItem = items.findIndex(x => x.id === filter[0].id);

    const data = [];
    const labels = [];

    for (let i = firstItem; i < items.length - 1; i++) {
      const inner = [];

      inner.push(this.toX(items[i - 5]));
      inner.push(this.toX(items[i - 4]));
      inner.push(this.toX(items[i - 3]));
      inner.push(this.toX(items[i - 2]));
      inner.push(this.toX(items[i - 1]));
      inner.push(this.toX(items[i]));

      // const l = [ ...this.toX(filter[i + 1]), filter[i + 1].units_sold];
      const l = [items[i + 1].temperature, items[i + 1].units_sold];
      // l.shift()
      labels.push(l);

      data.push(inner);
    }

    return {
      data,
      labels,
    };
  }

  public getTestingSample(items: IForcastingItem[]): IForcastingItem[] {
    return items.filter(x => x.index.startsWith('2017'));

    // const r = [];

    // for (let i = 0; i < filter.length; i++) {
    //   if (i % 5 === 0) {
    //     r.push(filter[i]);
    //   }
    // }

    // return r;
  }

  public toX(item: IForcastingItem) {
    const yearArray = [2015, 2016, 2017];
    const d = new Date(item.index);

    const r = [
      // item.id,
      d.getMonth(),
      this.daySpendFactor[d.getDay()],
      this.placementFactors.indexOf(item.placement),
      item.temperature,
      item.competing_brand_discount ? 1 : 0,
      item.discount ? 1 : 0,
      item.units_sold,
    ];

    // console.log(r);
    return r;
  }

  private map(
    input: number,
    in_min: number,
    in_max: number,
    out_min: number,
    out_max: number,
  ): number {
    return ((input - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  }
}
