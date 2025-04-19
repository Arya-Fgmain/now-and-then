import { useRef, useEffect } from 'react';

function OpenCVView({ imagePaths }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!window.cv || !imagePaths || imagePaths.length < 2) return;

    const canvas = canvasRef.current;
    const scale = 0.9;

    const loadImageAsMat = (srcPath) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = srcPath;

        img.onload = () => {
          const tempCanvas = document.createElement("canvas");
          const width = img.width * scale;
          const height = img.height * scale;
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext("2d");
          tempCtx.drawImage(img, 0, 0, width, height);

          const mat = cv.matFromImageData(tempCtx.getImageData(0, 0, width, height));
          // IMPORTANT this always reads 4 channels. Even if it's a single-channel grayscale, it just duplicates the channels :)
          resolve({ mat, width, height });
        };
      });
    };

    const processImages = async () => {
      const [img1, img2, img3, img4, img5, img6, img7, dots] = await Promise.all([
        loadImageAsMat(imagePaths[0]),
        loadImageAsMat(imagePaths[1]),
        loadImageAsMat(imagePaths[2]),
        loadImageAsMat(imagePaths[3]),
        loadImageAsMat(imagePaths[4]),
        loadImageAsMat(imagePaths[5]),
        loadImageAsMat(imagePaths[6]),
        loadImageAsMat(imagePaths[7]) // IMPORTANT this reads 4 channels whether or not the image actually is 4-channels or not
      ]);

      // Match sizes if needed
      canvas.width = img1.mat.cols;
      canvas.height = img1.mat.rows;

      cv.imshow(canvas, img1.mat);

      let result_initialized = false;
      let result = new cv.Mat();

      // create float version of dots for manipulations in the loop
      let dots_float = new cv.Mat();
      dots.mat.convertTo(dots_float, cv.CV_32F);

      // normalize the dots to 0-1 range
      const dots_norm = new cv.Mat();
      cv.normalize(dots_float, dots_norm, 0.0, 1.0, cv.NORM_MINMAX);

      // scale the dot pattern to image size for easy merging
      let dotsF = new cv.Mat();
      let dsize = new cv.Size(img1.mat.cols, img1.mat.rows);
      cv.resize(dots_norm, dotsF, dsize, 0, 0, cv.INTER_CUBIC);

      /* dilation & erosion <=> modifying dot intensity*/

      // important: perform the operation on floating-point values in the [0-1] range otherwise results will be distorted
      // const kern = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
      // let erd = new cv.Mat();
      // cv.erode(dotsF, erd, kern);
      // let dil = new cv.Mat();
      // cv.dilate(dotsF, dil, kern);
      // cv.imshow(canvas, dil);
      // kern.delete();
      // erd.delete();
      // dil.delete();

      /* random dot texture sampling */
      // important: assume panels are less than 1000x1000 FOR NOW
      const im_w = img1.mat.cols;
      const im_h = img1.mat.rows;

      // maximum possible (x,y) coordinates where we can crop a texture the size of our images
      // important: note the normalized dots (floating-point & 0-1 range) should be used, as these can be easily incorporated into the algorithm
      const x_max = dots_norm.cols - im_w;
      const y_max = dots_norm.rows - im_h;

      // random coordinates to crop from
      const x_begin = Math.floor(Math.random() * x_max);
      const y_begin = Math.floor(Math.random() * y_max);
      const crop_rect = new cv.Rect(x_begin, y_begin, im_w, im_h);

      // crop using the rect defined above
      let dots_cropped = new cv.Mat();
      dots_cropped = dots_norm.roi(crop_rect);

      // 100-216
      /* using quantized alphas to vary dot strength */

      // example target layer; realistically, this'd be picked by the user
      const target_layer = img5.mat;

      const target_layer_F = new cv.Mat();
      target_layer.convertTo(target_layer_F, cv.CV_32FC4);

      const target_layer_norm = new cv.Mat();
      cv.normalize(target_layer_F, target_layer_norm, 0.0, 1.0, cv.NORM_MINMAX);

      const target_chans = new cv.MatVector();
      cv.split(target_layer_norm, target_chans)

      // we just need the alpha channel
      const target_alpha = target_chans.get(3);

      // now quantize (based on Yagiz's method in 361, the first MATLAB lecture; ask Arya if you wanna see it)
      let temp = new cv.Mat();

      cv.multiply(target_alpha, new cv.Mat(target_alpha.rows, target_alpha.cols, target_alpha.type(), [5, 5, 5, 0]), temp);

      temp.convertTo(temp, cv.CV_8U);

      // contains quantized alpha map, which we will turn into masks for different dot sizes
      let quantized = new cv.Mat();
      temp.convertTo(quantized, cv.CV_32F, 1 / 5.0);

      temp.delete();
      target_layer_F.delete();
      target_chans.delete();
      target_alpha.delete();


      function masks_for_quantized_levels(src, levels) { // clean this up if possible
        return levels.map(level => {
          let scale_level = new cv.Mat(src.rows, src.cols, src.type(), [level, level, level, 0]);
          // let upper = new cv.Mat(src.rows, src.cols, src.type(), [level, level, level, 0]);

          let mask = new cv.Mat();

          cv.inRange(src, scale_level, scale_level, mask);
          // this checks for a range, but in this case the range is really a single-value interval = {scale_level}

          scale_level.delete()

          // need 4 channels so that we can operate the masks w the dots
          let mask_complete = new cv.MatVector();
          mask_complete.push_back(mask);
          mask_complete.push_back(mask);
          mask_complete.push_back(mask);
          mask_complete.push_back(mask);

          let mask_complete_merge = new cv.Mat();
          cv.merge(mask_complete, mask_complete_merge);

          let maskF = new cv.Mat();
          mask_complete_merge.convertTo(maskF, cv.CV_32FC4);

          mask.delete();
          mask_complete.delete();
          mask_complete_merge.delete();


          return maskF;
        });
      }

      let masks = masks_for_quantized_levels(quantized, [0.2, 0.4, 0.6, 0.8, 1]);

      function dots_for_quantized_levels(dots, num_levels) {
        let results = [];

        // essentially, dilate the dot map more and more, and save the different dilation levels
        for (let i = 0; i < num_levels; i++) {
          let k = i + 1;
          const kern = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(k, k));
          let dil = new cv.Mat();
          cv.dilate(dots, dil, kern);
          kern.delete();


          results.push(dil);
        }

        return results;
      }

      let dotStrengths = dots_for_quantized_levels(dots_cropped, 5);

      // initialize this with zeros, otherwise the results will be all over the place (seriously)
      let dots_combined = new cv.Mat.zeros(masks[0].rows, masks[0].cols, masks[0].type());

      /*
          MATLAB-equivalent, which this whole thing is based on:
          dots_combined = mask2 .* hf2 + mask3 .* hf3 + ... + maskn .* hfn;
      */
      for (let i = 0; i < dotStrengths.length; i++) {
        let curr_mask = masks[i];
        let curr_dots = dotStrengths[i];
        const curr_dot_map = new cv.Mat();
        cv.multiply(curr_dots, curr_mask, curr_dot_map);
        cv.add(curr_dot_map, dots_combined, dots_combined);
        curr_dot_map.delete();
      }

      // remember to normalize to the [0,1] range to prevent color distortions in the final result
      let dots_c_norm = new cv.Mat();
      cv.normalize(dots_combined, dots_c_norm, 0.0, 1.0, cv.NORM_MINMAX);

      // delete dots_cropped, replace it with this
      dots_cropped.delete();
      dots_cropped = dots_c_norm;

      let layers = [img1, img2, img3, img4, img5, img6, img7];


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
        cv.multiply(dots_cropped, alpha_mult, gamma_2);


        // cv.imshow(canvas, gamma_1)

        /* create gamma 2 */
        const gamma_1 = new cv.Mat();
        cv.subtract(alpha_mult, gamma_2, gamma_1);

        /* mult & add */

        // foreground color (dots)
        const dots_color = new cv.Mat(curr_layer_F.rows, curr_layer_F.cols, cv.CV_32FC4, new cv.Scalar(0.5, 0.5, 0.5, 1.0));
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

        // if this is the first iteration, need to initialize the 'result' output
        if (!result_initialized) {
          result = sum.clone();
          result_initialized = true;
        }
        else {
          cv.add(result, sum, result);
        }

        // free memory (good ol' C++ <3)
        curr_layer_float.delete();
        curr_layer_F.delete();
        curr_layer_split.delete();
        // layer_weighted.delete();
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

      // Remove alpha (keep only RGB)
      const allChannels = new cv.MatVector();
      cv.split(result, allChannels);

      // manually keep only first 3
      const rgbVec = new cv.MatVector();
      rgbVec.push_back(allChannels.get(0));
      rgbVec.push_back(allChannels.get(1));
      rgbVec.push_back(allChannels.get(2));

      // merge into final RGB result
      const rgbOnly = new cv.Mat();
      cv.merge(rgbVec, rgbOnly);

      // Normalize once at the end
      const finalDisplay = new cv.Mat();
      cv.normalize(rgbOnly, finalDisplay, 0, 255, cv.NORM_MINMAX);
      finalDisplay.convertTo(finalDisplay, cv.CV_8UC3);

      // Display it
      cv.imshow(canvas, finalDisplay);

      // Cleanup
      img1.mat.delete();
      img2.mat.delete();
      img3.mat.delete();
      img4.mat.delete();
      img5.mat.delete();
      img6.mat.delete();
      img7.mat.delete();
      dots.mat.delete();
      dots_float.delete();
      dots_norm.delete();
      dots_cropped.delete();
      dotsF.delete();
      result.delete();
      allChannels.delete();
      rgbVec.delete();
      rgbOnly.delete();
      finalDisplay.delete();
      quantized.delete();
      // dots_combined.delete();

      for (let i = 0; i < dotStrengths.length; i++) {
        masks[i].delete();
        dotStrengths[i].delete();
      }
    };

    processImages();
  }, [imagePaths]);

  return (
    <div>
      <h3>OpenCV Image Mixer</h3>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

export default OpenCVView;








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