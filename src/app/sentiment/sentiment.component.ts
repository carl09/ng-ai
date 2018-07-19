import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { combineLatest, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Component({
  selector: 'app-sentiment',
  templateUrl: './sentiment.component.html',
})
export class SentimentComponent implements OnInit {
  private readonly maxLength = 256;
  private readonly paddingValue = 0;

  constructor(private httpClient: HttpClient) {}

  public ngOnInit(): void {
    const results = combineLatest(
      this.getData('train_data.json', true).pipe(take(1)),
      this.getData('train_labels.json', false).pipe(take(1)),
      this.getData('test_data.json', true).pipe(take(1)),
      this.getData('test_labels.json', false).pipe(take(1)),
    );

    results.subscribe(([data, labels, test_data, test_labels]) => {
      console.log({ data, labels, test_data, test_labels });

      const vocab_size = 10000;

      const model = tf.sequential();

      // # model = keras.Sequential()
      // # model.add(keras.layers.Embedding(vocab_size, 16))
      // # model.add(keras.layers.GlobalAveragePooling1D())
      // # model.add(keras.layers.Dense(16, activation=tf.nn.relu))
      // # model.add(keras.layers.Dense(1, activation=tf.nn.sigmoid))

      // # model.summary()

      model.add(
        tf.layers.embedding({
          inputDim: vocab_size,
          outputDim: 16,
        }),
      );

      model.add(tf.layers.globalAveragePooling1d({}));

      model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
      model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
      // }

      const modelOptimizer = tf.train.adam();
      model.compile({
        loss: 'binaryCrossentropy',
        optimizer: modelOptimizer,
        metrics: ['accuracy'],
      });

      model.summary();

      console.log('ppretraining');

      this.train(model, data, labels, test_data, test_labels)
        .then(() => {
          console.log('Training compleate');
        })
        .catch(err => {
          console.error('error in training', err);
        });
    });
  }

  private async train(
    model: tf.Sequential,
    x: number[][],
    y: number[][],
    test_x: number[][],
    test_y: number[][],
  ) {
    console.log(x.length);
    console.log(y.length);

    const xs = tf.tensor2d(x.slice(0, 5000), [5000, 256]);
    const ys = tf.tensor2d(y.slice(0, 5000), [5000, 1]);

    const test_xs = tf.tensor2d(test_x.slice(0, 1000), [1000, 256]);
    const test_ys = tf.tensor2d(test_y.slice(0, 1000), [1000, 1]);

    const configCallbacks: tf.CustomCallbackConfig = {
      onBatchEnd: tf.nextFrame,
      onTrainEnd: logs => {
        console.log('onTrainEnd', logs);
        return tf.nextFrame();
      },
      onEpochEnd: (epoch: number, logs: tf.Logs) => {
        console.log('onEpochEnd', epoch, logs);
        return tf.nextFrame();
      },
    };

    const config: tf.ModelFitConfig = {
      epochs: 20,
      shuffle: true,
      callbacks: configCallbacks,
    };

    const history = await model.fit(xs, ys, config);

    console.log({ history });

    xs.dispose();
    ys.dispose();

    test_xs.dispose();
    test_ys.dispose();

    //  history = model.fit(partial_x_train,
    //                      partial_y_train,
    //                      epochs=40,
    //                      batch_size=512,
    //                      validation_data=(x_val, y_val),
    //                      verbose=1)
  }

  private getData(file: string, usePadding: boolean): Observable<number[][]> {
    return this.httpClient
      .get(`/assets/data/${file}`, {
        responseType: 'json',
      })
      .pipe(
        map(resp => resp as number[][]),
        map(resp => {
          return !usePadding
            ? resp
            : resp.map(x => {
                return pad(x, this.maxLength, this.paddingValue);
              });
        }),
      );
  }
}

function pad(array: number[], length: number, fill: number): number[] {
  return array
    .concat(Array(length).fill(fill, 0, array.length))
    .slice(0, length);
}
