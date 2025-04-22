# Now N' Then Project

## About this project
This application provides a library of dot patterns from old comic books and provides the functionality for a variety of dot effects. The project first uses soft color segmentation to segment the input image into layers, then we use various tools to add textures onto these layers and merge them back.

## Soft-Color Segmentation
We consider two segmentation methods here. First [unmixed soft-color segmentation method](https://github.com/liuguoyou/color-unmixing), which decomposes the image based on solving a series of optimization problems. The second is [fast soft color segmentation](https://github.com/pfnet-research/FSCS), which relies on a neural network to segment input images. While the second is better, it loses the details of dot patterns within the alpha layer, which is highly related to the decade and printing style. Therefore, in this project, we prefer to use the first method.

The SCS method is implemented based on the OpenCV library of old version, in which some features have been deprecated. We find out that it works using the OpenCV 2.7-3.5, and you can follow this [instruction](https://pyimagesearch.com/2018/05/28/ubuntu-18-04-how-to-install-opencv/) to install it. Then you can install the FSCS on your local machine and use it following the instructions provided by the authors.

## WebApp
We provide a web demo to help users access it. To run the demo, you first need to install the environment
```bash
cd WebApp
npm install
```
The environment relies on the `nodejs` and `npm` so you need to install them first. After the installation, you can run the demo by
```bash
npm run dev
```

## Functions
### Upload input layers
After you segment the input image into layers, you can upload the layers to the interface by clicking the `select files` in the `Upload Files` panel. Please make sure that all layers are uploaded at once, otherwise it is possible to generate weird images.

### Global settings
We support 4 settings affecting the final output. First, we provide a set of textures collected from different decades and various styles. You can select it based on your preference. We also  provide more textures. You can download form [here](https://1sfu-my.sharepoint.com/:u:/g/personal/mfa90_sfu_ca/Ef1_v2XRZH5IlagXNWI2zIABjs8mEOQF4-PkIOcx-Y3HDQ?e=Bg7oey) and put it in the `/public` folder.

Second, we provide a color picker to help you select the dot color, and the interface uses this color as the dot color to render the final output.

Third, dot strength is a variable to represent the size of dots, and a larger strength generates larger dots. The default value is set as 5.

Fourth, quantization levels are used to build masks for a specific layer when applying dot patterns, and it works only when you apply a specific layer or apply multiple dot patterns on different layers.

### Apply textures to the whole page
To apply the dot textures onto the whole page, you can first set your configurations at first, and then click the button `Apply on Whole Page!`, which will output a combined output with applying dots on the whole image.

### Apply textures on the specific layer
To apply textures on a specific layer, you can first click the button `select pixel`, which activates the function to help you select any pixels on the image. After you click some pixels and click the `apply quantization` button, the dot texture is applied to a specific layer. This layer is selected by the largest alpha values within each layer corresponding to the selected coordinates, and only the layer with the largest alpha value is used.

### Apply multiple textures on different layers
To apply multiple textures on different layers, first, you need to select textures for some layers. After this, click the `Apply Multiple Dot Patterns!` button, and an image applying different textures on corresponding layers is generated. You can also use dot color, dot strength,  and quantization levels to adjust the style of the dots, while the texture selected in the texture option does not work here.