import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';

export interface IForcastingItem {
  id: number;
  index: string;
  units_sold: number;
  discount: boolean;
  placement: string;
  // "end_of_aisle": "FALSE",
  // "public_holiday": "FALSE",
  // "sales": 1155,
  // "price": 21,
  // "male_ratio": 0.45322502,
  // "avg_income": 94981.74992,
  // "avg_income_delta": 14981.74992,
  // "avg_income_quartile": 4,
  temperature: number;
  // "week_years": "2018/01/15",
  // "competing_brand_6pk_price": 16.2,
  competing_brand_discount: boolean;
}

@Injectable()
export class ForcastingService {
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
      tf.layers.dense({
        inputDim: 6,
        units: 4,
        activation: 'relu',
        kernelInitializer: tf.initializers.constant({
          value: 0.2,
        }),
      }),
    );

    this.model.add(
      tf.layers.dense({
        units: 1,
        activation: 'relu',
        kernelInitializer: tf.initializers.constant({
          value: 0.2,
        }),
      }),
    );

    // const modelOptimizer = tf.train.adamax(0.1);
    const modelOptimizer = tf.train.adam(0.01);
    this.model.compile({
      loss: 'meanSquaredError',
      optimizer: modelOptimizer,
      // metrics: ['accuracy'],
    });

    this.model.summary();
  }

  public async train(
    training: IForcastingItem[],
    testing: IForcastingItem[],
    callback?: (epoch: number, logs: tf.Logs) => void,
  ) {
    const data_xs = training.map(x => this.toX(x));

    const test_data_xs = testing.map(x => this.toX(x));

    const xs = tf.tensor2d(data_xs);
    const test_xs = tf.tensor2d(test_data_xs);

    const labels_ts: number[] = training.map(f => {
      return f.units_sold;
    });

    const test_labels_ts: number[] = testing.map(f => {
      return f.units_sold;
    });
    const ys = tf.tensor1d(labels_ts);
    const test_ys = tf.tensor1d(test_labels_ts);

    console.log('training', { data_xs, labels_ts });

    const epochs = 51;
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
      shuffle: false,
      callbacks: configCallbacks,
      validationData: [test_xs, test_ys],
    };
    const history = await this.model.fit(xs, ys, config);

    // this.model.summary();

    // console.log(this.model.weights);

    // this.model.weights.forEach(l => {
    //   const f = this.model.getLayer(undefined, l.id).weights;
    //   console.log(f);
    // });

    // console.log({ history });

    xs.dispose();
    ys.dispose();

    test_xs.dispose();
    test_ys.dispose();
  }

  public guessSimple(item: IForcastingItem): number {
    const xs = tf.tensor2d([this.toX(item)]);

    const guessResult = this.model.predict(xs) as tf.Tensor;
    const data = guessResult.dataSync();
    xs.dispose();
    guessResult.dispose();
    // console.log('guessSimple.data', data[0], item.units_sold);
    return data[0];
  }

  public getTraining(items: IForcastingItem[]): IForcastingItem[] {
    return items.filter(x => !x.index.startsWith('2017'));
  }

  public getTesting(items: IForcastingItem[]): IForcastingItem[] {
    const filter = items.filter(x => x.index.startsWith('2017'));

    const r = [];

    for (let i = 0; i < filter.length; i++) {
      if (i % 5 === 0) {
        r.push(filter[i]);
      }
    }

    return r;
  }

  private toX(item: IForcastingItem) {
    // const index = Math.round(new Date(item.index).getTime() / 1000);
    const yearArray = [2015, 2016, 2017];
    const d = new Date(item.index);

    const r = [
      // yearArray.indexOf(d.getFullYear()), // d.getFullYear(), // % 2000,
      d.getMonth(),
      this.daySpendFactor[d.getDay()],
      // d.getDay(),
      // d.getDate(),
      // this.monthFactors.indexOf(item.index.substr(5, 2)),
      this.placementFactors.indexOf(item.placement),
      item.temperature,
      item.competing_brand_discount ? 1 : 0,
      item.discount ? 1 : 0,
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
