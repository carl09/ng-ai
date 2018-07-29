import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { IFormItem } from './widget-data.service';

@Injectable()
export class EncoderModelService {
  private model: tf.Sequential;

  private maxEncoderSeqLength: number;
  private numEncoderTokens: number;

  private inputTokenIndex: string[];

  constructor() {
    this.maxEncoderSeqLength = 15;
  }

  public async createModel(items: IFormItem[], widgets: string[]) {
    this.model = tf.sequential();
    this.inputTokenIndex = this.getvocab(items);
    this.numEncoderTokens = this.inputTokenIndex.length;

    this.model.add(
      tf.layers.conv1d({
        inputShape: [this.maxEncoderSeqLength, this.numEncoderTokens],
        kernelSize: 5,
        filters: 8,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
      }),
    );

    this.model.add(tf.layers.flatten());

    // this.model.add(tf.layers.dense({ inputDim : 4, units: 16, activation: 'relu' }));
    // this.model.add(tf.layers.dense({ units: 8, activation: 'sigmoid' }));
    // this.model.add(tf.layers.dropout({ rate: 0.2 }));

    this.model.add(
      tf.layers.dense({ units: widgets.length, activation: 'softmax' }),
    );

    const modelOptimizer = tf.train.sgd(0.1);
    this.model.compile({
      loss: 'categoricalCrossentropy',
      optimizer: modelOptimizer,
      metrics: ['accuracy'],
    });

    this.model.summary();
  }

  public async train(
    items: IFormItem[],
    widgets: string[],
    callback: (epoch: number, logs: tf.Logs) => void,
  ) {
    console.log('EncoderModelService.train');

    const xs = this.encodeString(items.map(x => x.name));

    const y: number[] = items.map(f => {
      return widgets.indexOf(f.widget);
    });

    const labels_ts = tf.tensor1d(y, 'int32');

    const ys = tf.oneHot(labels_ts, widgets.length);

    console.log(xs.shape);
    xs.print();

    const configCallbacks: tf.CustomCallbackConfig = {
      onBatchEnd: tf.nextFrame,
      // onTrainEnd: logs => {
      //   console.log('onTrainEnd', logs);
      //   return tf.nextFrame();
      // },
      onEpochEnd: (epoch: number, logs: tf.Logs) => {
        callback(epoch, logs);
        console.log('onEpochEnd', epoch, logs);
        return tf.nextFrame();
      },
    };

    const config: tf.ModelFitConfig = {
      epochs: 100,
      shuffle: true,
      callbacks: configCallbacks,
      // validationSplit: 0.1,
      // validationData: [xs, ys]
    };

    const history = await this.model.fit(xs, ys, config);

    console.log({ history });

    xs.dispose();
    ys.dispose();
  }

  public guess(items: IFormItem[], widgets: string[]): IFormItem[] {
    const guessed: IFormItem[] = [];

    items.forEach((item, i) => {
      const xs = this.encodeString([item.name]);

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

  private encodeString(strings: string[]) {
    // tslint:disable-next-line:prefer-for-of

    const encoded = tf.buffer([
      strings.length,
      this.maxEncoderSeqLength,
      this.numEncoderTokens,
    ]);

    for (let z = 0; z < strings.length; ++z) {
      const str = strings[z];
      console.log(str);
      const strLen = str.length;

      for (let i = 0; i < strLen; ++i) {
        if (i >= this.maxEncoderSeqLength) {
          console.error(
            'Input sentence exceeds maximum encoder sequence length: ' +
              this.maxEncoderSeqLength,
          );
        }

        const tokenIndex = this.inputTokenIndex.indexOf(str[i]); //  [];
        if (tokenIndex == null) {
          console.error(
            'Character not found in input token index: "' + tokenIndex + '"',
          );
        }
        encoded.set(1, z, i, tokenIndex);
      }
    }

    return encoded.toTensor();
  }

  private getvocab(formItems: IFormItem[]): string[] {
    const results = ['^']; // hack no 0

    formItems.forEach(x => {
      const words = x.name.toLowerCase().split('');
      words.forEach(y => {
        if (results.indexOf(y) === -1) {
          results.push(y);
        }
      });
    });

    return results;
  }
}
