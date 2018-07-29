import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { IFormItem } from './widget-data.service';

@Injectable()
export class EmbeddingModelService {
  private maxLength = 2;
  private paddingValue = 0;

  private model: tf.Sequential;
  private vocabitems: string[];

  public async createModel(items: IFormItem[], widgets: string[]) {
    this.model = tf.sequential();

    this.vocabitems = this.getvocab(items);

    const vocab_size = this.vocabitems.length + 1;

    this.model.add(
      tf.layers.embedding({
        inputDim: vocab_size,
        outputDim: 16,
        // maskZero: true
      }),
    );

    this.model.add(tf.layers.globalAveragePooling1d({}));

    this.model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: 16, activation: 'sigmoid' }));

    this.model.add(
      tf.layers.dense({ units: widgets.length, activation: 'softmax' }),
    );

    const modelOptimizer = tf.train.adam();
    this.model.compile({
      loss: 'categoricalCrossentropy',
      optimizer: modelOptimizer,
      metrics: ['accuracy'],
    });

    // this.model.summary();
  }

  public async train(items: IFormItem[], widgets: string[]) {
    const x: number[][] = items
      .map(f => {
        return f.name.split(' ').map(z => {
          return this.vocabitems.indexOf(z);
        });
      })
      .map(z => {
        return pad(z, this.maxLength, this.paddingValue);
      });

    const y: number[] = items.map(f => {
      return widgets.indexOf(f.widget);
    });

    const xs = tf.tensor2d(x);
    const labels_ts = tf.tensor1d(y, 'int32');

    const ys = tf.oneHot(labels_ts, widgets.length);

    labels_ts.dispose();

    console.log(xs.shape);

    xs.print();
    ys.print();

    const configCallbacks: tf.CustomCallbackConfig = {
      onBatchEnd: tf.nextFrame,
      // onTrainEnd: logs => {
      //   console.log('onTrainEnd', logs);
      //   return tf.nextFrame();
      // },
      onEpochEnd: (epoch: number, logs: tf.Logs) => {
        console.log('onEpochEnd', epoch, logs);
        return tf.nextFrame();
      },
    };

    const config: tf.ModelFitConfig = {
      epochs: 200,
      shuffle: true,
      callbacks: configCallbacks,
      validationSplit: 0.1,
      // validationData: [xs, ys]
    };

    const history = await this.model.fit(xs, ys, config);

    console.log({ history });

    xs.dispose();
    ys.dispose();
  }

  public guess(items: IFormItem[], widgets: string[]): IFormItem[] {
    const guessed: IFormItem[] = [];

    const x = items
      .map(f => {
        return f.name.split(' ').map(z => {
          return this.vocabitems.indexOf(z);
        });
      })
      .map(z => {
        return pad(z, this.maxLength, this.paddingValue);
      });

    x.forEach((item, i) => {
      const xs = tf.tensor2d([item]);

      const guessResult = (this.model.predict(xs) as tf.Tensor).argMax(-1);

      const data = guessResult.dataSync();

      xs.dispose();
      guessResult.dispose();

      // console.log(data);
      guessed.push({
        name: items[i].name,
        widget: widgets[data[0]],
      });
    });

    return guessed;
  }

  private getvocab(formItems: IFormItem[]): string[] {
    const results = ['<NOTUSED>'];

    formItems.forEach(x => {
      const words = x.name.toLowerCase().split(' ');
      words.forEach(y => {
        if (results.indexOf(y) === -1) {
          results.push(y);
        }
      });
    });

    return results;
  }
}

function pad(array: number[], length: number, fill: number): number[] {
  return array.concat(Array(length).fill(fill, 0, length)).slice(0, length);
}
