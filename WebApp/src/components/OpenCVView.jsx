import { useRef, useEffect } from 'react';

function get_dots_color(color) {
  const hex = color.replace(/^#/, '');

  // Parse r, g, b from hex
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  // Normalize to 0-1 range
  const rst = [r / 255, g / 255, b / 255, 1];

  return rst;
}

function OpenCVView({ imagePaths, dotStrength, dotsColor }) {
  const canvasRef = useRef();

  useEffect(() => {
    console.log("entering use effect")
    console.log(imagePaths)
    if (!window.cv || !imagePaths || imagePaths.length < 2) return;

    const canvas = canvasRef.current;
    const dot_colors = get_dots_color(dotsColor);

    const loadImageAsMat = (srcPath) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = srcPath;

        img.onload = () => {
          // const tempCanvas = document.createElement("canvas");
          const tempCanvas = document.getElementById("canvas");
          const width = img.width;
          const height = img.height;
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext("2d");
          tempCtx.drawImage(img, 0, 0, width, height);

          const mat = cv.matFromImageData(tempCtx.getImageData(0, 0, width, height));
          // IMPORTANT this always reads 4 channels.Even if it's a single-channel grayscale, it just duplicates the channels :)
          resolve({ mat, width, height });
        };

        img.remove();
      });
    };

    const processImages = async () => {

      const loadedMats = await Promise.all(imagePaths.map(path => loadImageAsMat(path)));
      const dots = loadedMats.pop(); // Last one is the dot pattern
      const layers = loadedMats;

      // Match sizes if needed
      canvas.width = layers[0].mat.cols;
      canvas.height = layers[0].mat.rows;

      cv.imshow(canvas, layers[0].mat);

      let result_initialized = false;
      let result;

      // create float version of dots for manipulations in the loop
      let dots_float = new cv.Mat();
      dots.mat.convertTo(dots_float, cv.CV_32F);

      // normalize the dots to 0-1 range
      const dots_norm = new cv.Mat();
      cv.normalize(dots_float, dots_norm, 0.0, 1.0, cv.NORM_MINMAX);


      // scale the dot pattern to image size for easy merging
      let dotsF = new cv.Mat();
      // let dotsF;
      let dsize = new cv.Size(layers[0].mat.cols, layers[0].mat.rows);
      cv.resize(dots_norm, dotsF, dsize, 0, 0, cv.INTER_CUBIC);

      /* dilation & erosion <=> modifying dot intensity*/

      //important: perform the operation on floating-point values in the [0-1] range otherwise results will be distorted

      const dot_strength = dotStrength.Settings["Dot Size"];

      const kern = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(dot_strength, dot_strength));
      let erd = new cv.Mat();
      cv.erode(dotsF, erd, kern);
      let dil = new cv.Mat();
      cv.dilate(dotsF, dil, kern);
      kern.delete();

      dotsF.delete();
      dotsF = dil;

      // check for dot size modification from the user
      if (dot_strength > 5) {
        dotsF = dil;
        erd.delete();
      }
      else if (dot_strength < 5) {
        dotsF = erd;
        dil.delete();
      }

      dots.mat.delete();
      dots_float.delete();
      dots_norm.delete();

      for (let i = 0; i < layers.length; i++) {
        const curr_layer = layers[i].mat;

        // convert to float first
        const curr_layer_float = new cv.Mat();
        curr_layer.convertTo(curr_layer_float, cv.CV_32F);

        // convert to 0-1 range for gamma-related endeavors
        const curr_layer_F = new cv.Mat();
        cv.normalize(curr_layer_float, curr_layer_F, 0.0, 1.0, cv.NORM_MINMAX);

        // now separate the channels so that we can single-out the alpha
        const curr_layer_split = new cv.MatVector();
        cv.split(curr_layer_F, curr_layer_split);

        // get the alpha
        const curr_alpha = curr_layer_split.get(3);
        // curr_alpha.convertTo(curr_alpha, cv.CV_32F, 1.0/255.0);

        // construct the 4-channel alpha image
        const alpha_vec = new cv.MatVector();
        alpha_vec.push_back(curr_alpha); alpha_vec.push_back(curr_alpha); alpha_vec.push_back(curr_alpha); alpha_vec.push_back(curr_alpha);

        // merge the 4 together
        const alpha_mult = new cv.Mat();
        cv.merge(alpha_vec, alpha_mult);

        /* create gamma 1 */

        // must modulate hf by alpha_mult
        const gamma_2 = new cv.Mat();
        cv.multiply(dotsF, alpha_mult, gamma_2);

        // cv.imshow(canvas, gamma_1)

        /* create gamma 2 */
        const gamma_1 = new cv.Mat();
        cv.subtract(alpha_mult, gamma_2, gamma_1);

        /* mult & add */

        // foreground color (dots)
        const dots_color = new cv.Mat(
          curr_layer_F.rows,
          curr_layer_F.cols,
          cv.CV_32FC4,
          dot_colors);
        const colors_fg = new cv.Mat();
        cv.multiply(dots_color, gamma_2, colors_fg);

        // background color
        const colors_bg = new cv.Mat();
        cv.multiply(curr_layer_F, gamma_1, colors_bg);

        // multiply the channel by the alphas
        // const layer_weighted = new cv.Mat();
        // cv.multiply(curr_layer_F, alpha_mult, layer_weighted);

        // put foreground & background together
        const sum = new cv.Mat();
        cv.add(colors_bg, colors_fg, sum);

        // // if this is the first iteration, need to initialize the 'result' output
        // if (!result_initialized) {
        //   result = sum.clone();
        //   result_initialized = true;
        // }
        // else {
        //   cv.add(result, sum, result);
        // }
        if (!result_initialized) {
          result = sum.clone();
          result_initialized = true;
        } else {
          let tmp = new cv.Mat();
          cv.add(result, sum, tmp);
          result.delete(); // free old result
          result = tmp;
        }

        // // free memory (good ol' C++ <3)
        curr_layer_float.delete();
        curr_layer_F.delete();
        curr_layer_split.delete();
        // // layer_weighted.delete();
        curr_alpha.delete();
        alpha_vec.delete();
        alpha_mult.delete();
        gamma_1.delete();
        gamma_2.delete();
        dots_color.delete();
        colors_fg.delete();
        colors_bg.delete();
        sum.delete();
      }

      layers.forEach(layer => layer.mat.delete());
      dotsF.delete();

      // Remove alpha (keep only RGB)
      const allChannels = new cv.MatVector();
      cv.split(result, allChannels);
      result.delete();

      // manually keep only first 3
      const rgbVec = new cv.MatVector();
      rgbVec.push_back(allChannels.get(0));
      rgbVec.push_back(allChannels.get(1));
      rgbVec.push_back(allChannels.get(2));

      // merge into final RGB result
      const rgbOnly = new cv.Mat();
      cv.merge(rgbVec, rgbOnly);
      rgbVec.delete();

      // Normalize once at the end
      const finalDisplay = new cv.Mat();
      cv.normalize(rgbOnly, finalDisplay, 0, 255, cv.NORM_MINMAX);
      rgbOnly.delete();

      finalDisplay.convertTo(finalDisplay, cv.CV_8UC3);

      // Display it
      cv.imshow(canvas, finalDisplay);

      // Cleanup
      // layers.forEach(layer => layer.mat.delete());
      // dots.mat.delete();
      // dots_float.delete();
      // dots_norm.delete();
      // dotsF.delete();
      // result.delete();
      // allChannels.delete();
      // rgbVec.delete();
      // rgbOnly.delete();
      finalDisplay.delete();
    };

    processImages();
    // }, [imagePaths, dotStrength, dotsColor]);
  }, []);

  return (
    <div>
      <canvas id="canvas" ref={canvasRef}></canvas>
    </div>
  );
}

export default OpenCVView;


const handleDownload = () => {
  const canvas = canvasRef.current;
  const image = canvas.toDataURL('image/png'); // or 'image/jpeg'
  const link = document.createElement('a');
  link.href = image;
  link.download = 'result.png';
  link.click();
};







/*

      // Match sizes if needed
      canvas.width = dots.mat.cols;
      canvas.height = dots.mat.height;

      // console.log(dots.mat.channels())

      cv.imshow(canvas, dots.mat);

      // scalar matrix
      const scal = new cv.Mat(canvas.height, canvas.width, cv.CV_32FC4, new cv.Scalar(5.0, 5.0, 5.0, 1.0));
        // IMPORTANT had to specify 32_FC4 for 4 channels

      // turn dots into float
      const dotsF = new cv.Mat(); dots.mat.convertTo(dotsF, cv.CV_32F);
        // IMPORTANT no need to specify 4 channels because we're converting a 4-channel image

      console.log(dotsF.channels());
      console.log('also ' + scal.channels())

      // scale
      const dotsScaled = new cv.Mat();
      cv.multiply(dotsF, scal, dotsScaled);

      // turn back into int
      const dotsSU = new cv.Mat(); dotsScaled.convertTo(dotsSU, cv.CV_8UC1);

      cv.imshow(canvas, dotsSU);
*/