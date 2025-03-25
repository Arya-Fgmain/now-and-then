# aging-digital-comics
CMPT 461 Comic Book Revival Project!

## FSCS

### Install

1. Install the virtual environment
```bash
python -m venv venv
```
I didn't specify the version of Python, but it works with Python 3.12.

2. Install packages
```bash
pip install -r requirements.txt
```

After that, the FSCS should be installed successfully.

### Color Segmentation

If you only need to use the segmentation, you only need to run the file `FSCS/src/inference.ipynb`. Otherwise, you may need to check the detailed information in [FSCS](https://github.com/pfnet-research/FSCS.git). The notebook accomplishes two tasks:

#### Obtain Palette
It simply uses KMeans to generate the palette. Run the code in the last two cells.

```python
import numpy as np
import cv2
from sklearn.cluster import KMeans
import pandas as pd

### User inputs
num_clusters = 7
img_name = 'apple.jpg'
img_path = '../dataset/test/' + img_name

###

img = cv2.imread(img_path)[:, :, [2, 1, 0]]
size = img.shape[:2]
vec_img = img.reshape(-1, 3)
# model = KMeans(n_clusters=num_clusters, n_jobs=-1)
model = KMeans(n_clusters=num_clusters, init='k-means++')
pred = model.fit_predict(vec_img)
pred_img = np.tile(pred.reshape(*size,1), (1,1,3))

center = model.cluster_centers_.reshape(-1)
print(center)
```

then output the palette into some predefined format

```python
# Reshape for an input
print('img_name = \'%s\';' % img_name, end=" ")
for k, i in enumerate(model.cluster_centers_):
    print('manual_color_%d = [' % k + str(i[0].astype('int')) +', '+ str(i[1].astype('int'))+  ', '+ str(i[2].astype('int')) + '];', end=" ")
```

Paste the output in the configuration cell (should be the 3rd cell). This is the palette you required for segmentation.

#### Segmentation

Before running the script, you also need to modify two files.

1. Modify the file names in `sample.csv` as your input file names
2. Replace the palette within `palette_7_sample.csv` as your input palette.

You can also use some other files to store your input without changing the given examples. Here is what I did in practice.

1. Create two files `comics.csv` and `palette_7_comics.csv`. Make sure the basename of the first `.csv` file is exactly the same within `palette_7_{basename}.csv`, otherwise an error is raised.
2. Run the KMeans method mentioned above to get the palette.
3. Add the path of the comic book pages into the `comics.csv` and add the palette into the `palette_7_comics.csv`.
4. Modify the variable values within `inference.ipynb`: `csv_path=comics.csv`.
5. Also remember if your input comic pages are not in the `dataset/test/` directory, then you also need to modify the value of variable `img_path`.
6. After that, directly run the code, and it should work.