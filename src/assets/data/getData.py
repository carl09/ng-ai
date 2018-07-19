import codecs
import json

import tensorflow as tf
from tensorflow import keras

imdb = keras.datasets.imdb

(train_data, train_labels), (test_data,
                             test_labels) = imdb.load_data(num_words=10000)


json.dump(test_data.tolist(), codecs.open('test_data.json', 'w', encoding='utf-8'), sort_keys=True, indent=4)
json.dump(test_labels.tolist(), codecs.open('test_labels.json', 'w', encoding='utf-8'), sort_keys=True, indent=4)
json.dump(train_data.tolist(), codecs.open('train_data.json', 'w', encoding='utf-8'), sort_keys=True, indent=4)
json.dump(train_labels.tolist(), codecs.open('train_labels.json', 'w', encoding='utf-8'), sort_keys=True, indent=4)



# # A dictionary mapping words to an integer index
word_index = imdb.get_word_index()

# The first indices are reserved
word_index = {k: (v+3) for k, v in word_index.items()}
word_index["<PAD>"] = 0
word_index["<START>"] = 1
word_index["<UNK>"] = 2  # unknown
word_index["<UNUSED>"] = 3

reverse_word_index = dict([(value, key)
                           for (key, value) in word_index.items()])

json.dump(reverse_word_index, codecs.open('word_index.json', 'w', encoding='utf-8'), sort_keys=True, indent=4)
