import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';

export interface IForcastingItem {
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
  private monthFactors: string[];

  constructor() {}

  public async createModel(items: IForcastingItem[]) {
    this.placementFactors = items
      .map(x => x.placement)
      .filter((value, index, self) => self.indexOf(value) === index);

    this.monthFactors = items
      .map(x => x.index.substr(5, 2))
      .filter((value, index, self) => self.indexOf(value) === index);

    console.log(
      'monthFactors, placementItems ',
      this.monthFactors,
      this.placementFactors,
    );

    this.model = tf.sequential();

    this.model.add(
      tf.layers.dense({ inputDim: 2, units: 16, activation: 'relu' }),
    );

    this.model.add(tf.layers.dense({ units: 1, activation: 'relu' }));

    // const modelOptimizer = tf.train.adamax(0.1);
    const modelOptimizer = tf.train.adam(0.1);
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
    callback: (epoch: number, logs: tf.Logs) => void,
  ) {
    const data_xs = training.map(x => {
      return [
        this.monthFactors.indexOf(x.index.substr(5, 2)),
        this.placementFactors.indexOf(x.placement),
      ];
    });

    const test_data_xs = testing.map(x => {
      return [
        this.monthFactors.indexOf(x.index.substr(5, 2)),
        this.placementFactors.indexOf(x.placement),
      ];
    });

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

    const epochs = 55;
    const sampleRate = epochs > 10 ? Math.floor(epochs / 10) : 1;
    const configCallbacks: tf.CustomCallbackConfig = {
      onBatchEnd: tf.nextFrame,
      onEpochEnd: (epoch: number, logs: tf.Logs) => {
        if (epoch % sampleRate === 0) {
          callback(epoch, logs);
        }
        return tf.nextFrame();
      },
    };
    const config: tf.ModelFitConfig = {
      epochs,
      shuffle: false,
      callbacks: configCallbacks,
      validationData: [test_xs, test_ys],
    };
    const history = await this.model.fit(xs, ys, config);
    console.log({ history });

    xs.dispose();
    ys.dispose();

    test_xs.dispose();
    test_ys.dispose();
  }

  public guessSimple(items: IForcastingItem): number {
    const data_xs = [
      this.monthFactors.indexOf(items.index.substr(5, 2)),
      this.placementFactors.indexOf(items.placement),
    ];

    const xs = tf.tensor2d([data_xs]);

    const guessResult = this.model.predict(xs) as tf.Tensor;
    const data = guessResult.dataSync();
    xs.dispose();
    guessResult.dispose();
    console.log('guessSimple.data', data[0], items.units_sold);
    return data[0];
  }

  // public guess(items: IForcastingItem[]) {
  // const guessed: IFormItem[] = [];
  // items.forEach((item, i) => {
  //   const xs = this.encodeString([item.name]);
  //   const guessResult = (this.model.predict(xs) as tf.Tensor).argMax(-1);
  //   const data = guessResult.dataSync();
  //   xs.dispose();
  //   guessResult.dispose();
  //   // console.log(data);
  //   guessed.push({
  //     name: items[i].name,
  //     widget: widgets[data[0]],
  //   });
  // });
  // return guessed;
  // }

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
}
