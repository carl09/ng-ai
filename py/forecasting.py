from __future__ import absolute_import, division, print_function

import pandas as pd
import tensorflow as tf
from tensorflow import keras
import os
import matplotlib.pyplot as plt
import numpy as np

PATH = "./temp"


class PrintDot(keras.callbacks.Callback):
    def on_epoch_end(self, epoch, logs):
        if epoch % 100 == 0:
            print('')
        print('.', end='')


def plot_history(history):
    plt.figure()
    plt.xlabel('Epoch')
    plt.ylabel('Mean Abs Error [1000$]')
    # plt.plot(history.epoch, np.array(
    #     history.history['loss']), label='Train Loss')
    plt.plot(history.epoch, np.array(
        history.history['mean_absolute_error']), label='Train Loss')
    plt.plot(history.epoch, np.array(
        history.history['val_mean_absolute_error']), label='Val loss')
    plt.legend()
    # plt.ylim([0, 5])
    plt.show()


CSV_COLUMN_NAMES = ["price", "sales", "units_sold"]


def load_data(data):
    df1 = data[CSV_COLUMN_NAMES]
    return df1, df1.pop("units_sold")


def train_input_fn(features, labels):
    dataset = tf.data.Dataset.from_tensor_slices((dict(features), labels))
    return dataset


csv_path = os.path.join(os.curdir, "forecasting_data.csv")
print(csv_path)
forcasting = pd.read_csv(csv_path)


# forcasting.hist(bins=100, figsize=(20, 15))
# # save_fig("attribute_histogram_plots")
# plt.show()

# forcasting["units_sold"].hist()
# # save_fig("units_sold_plots")
# plt.show()

# forcasting.plot(kind="scatter", x="units_sold", y="avg_income")
# # save_fig("scatter_plot")
# plt.show()

# train_x, train_y = load_data(forcasting)


# def foo():
#     return tf.estimator.inputs.pandas_input_fn(
#         forcasting[CSV_COLUMN_NAMES],
#         y=None,
#         batch_size=128,
#         num_epochs=1,
#         shuffle=True,
#         queue_capacity=1000,
#         num_threads=1,
#         target_column='units_sold'
#     )


# classifier = tf.estimator.Estimator(
#     model_fn=foo,
#     model_dir=PATH)

# classifier.train(input_fn=lambda: train_input_fn(train_x, train_y))

# print(foo)

forcasting['index2'] = forcasting['index'].astype('str')
train_x, train_y = load_data(forcasting.loc[~forcasting.index2.str.contains('2017')])
validation_x, validation_y = load_data(forcasting.loc[forcasting.index2.str.contains('2017')])

sess = tf.Session()

writer = tf.summary.FileWriter("./logging")

model = keras.Sequential([
    keras.layers.Dense(6, activation=tf.nn.relu, input_shape=(train_x.shape[1],)),
    keras.layers.Dense(8, activation=tf.nn.relu),
    keras.layers.Dense(1)
])

optimizer = tf.train.AdamOptimizer(0.01)

model.compile(loss='mse',
              optimizer=optimizer,
              metrics=['mae'])

model.summary()

history = model.fit(train_x, train_y, epochs=50,
                    validation_data=(validation_x, validation_y),
                    validation_split=0.2,
                    verbose=0,
                    callbacks=[PrintDot()]
                    )


plot_history(history)

test_predictions = model.predict(validation_x).flatten()

writer.close()
