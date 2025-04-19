/**
 * @fileoverview This file contains functions to handle color layer selection
 * based on the coordinates where the mouse is pointed. It provides utilities
 * to interact with and manipulate color layers dynamically.
 * 
 * @author Xiangxiang Wang
 * @date 2025-04-17
 */

function GetLayer({ paths }) {
    // same as OpenCVView.loadImageAsMat

    const loadImageAsMat = (path) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                const mat = cv.imread(img);
                mat.data
                resolve(mat);
            };
            img.onerror = (err) => {
                reject(err);
            };
        });
    };

    const im2norm = (img) => {
        const f_mat = new cv.Mat();
        img.convertTo(f_mat, cv.CV_32FC4);

        const norm_mat = new cv.Mat();
        cv.normalize(f_mat, norm_mat, 0.0, 1.0, cv.NORM_MINMAX);

        f_mat.delete();

        return norm_mat;
    };

    const initialize = async (layer) => {
        // example target layer; realistically, this'd be picked by the user
        // const target_layer = new cv.Mat();
        // layer.convertTo(target_layer, cv.CV_32FC4);

        // const target_layer_norm = new cv.Mat();
        // cv.normalize(target_layer, target_layer_norm, 0.0, 1.0, cv.NORM_MINMAX);
        const norm_layer = im2norm(layer);

        const target_chans = new cv.MatVector();
        cv.split(norm_layer, target_chans)

        // we just need the alpha channel
        const target_alpha = target_chans.get(3);

        // now quantize (based on Yagiz's method in 361, the first MATLAB lecture; ask Arya if you wanna see it)
        let temp = new cv.Mat();
        cv.multiply(
            target_alpha,
            new cv.Mat(target_alpha.rows,
                target_alpha.cols,
                target_alpha.type(),
                [5, 5, 5, 0]),
            temp);
        temp.convertTo(temp, cv.CV_8U);

        // contains quantized alpha map, which we will turn into masks for different dot sizes
        let quantized = new cv.Mat();
        temp.convertTo(quantized, cv.CV_32F, 1 / 5.0);

        norm_layer.delete();
        temp.delete();
        target_chans.delete();
        target_alpha.delete();

        return quantized;
    };

    const buildMask = async (src, levels) => {
        return levels.map(level => {
            let scale_level = new cv.Mat(
                src.rows,
                src.cols,
                src.type(),
                [level, level, level, 0]
            );
            let mask = new cv.Mat();
            cv.inRange(src, scale_level, scale_level, mask);

            let channels = new cv.MatVector();
            for (let i = 0; i < 4; ++i) channels.push_back(mask);

            let merged = new cv.Mat();
            cv.merge(channels, merged);

            let rst = new cv.Mat();
            merged.convertTo(rst, cv.CV_32FC4);

            scale_level.delete();
            mask.delete();
            channels.delete();
            merged.delete();

            return rst;
        });
    };

    const dots_init = async (layer, dots) => {
        const norm_dots = im2norm(dots);
        const pruned_dots = new cv.Mat();
        const layer_size = new cv.Size(layer.cols, layer.rows);

        cv.resize(norm_dots, pruned_dots, layer_size, 0, 0, cv.INTER_CUBIC);

        const y_max = norm_dots.cols - layer.cols;
        const x_max = norm_dots.rows - layer.rows;
        const crop_area = new cv.Rect(
            Math.floor(Math.random() * y_max),
            Math.floor(Math.random() * x_max),
            layer.cols,
            layer.rows
        );

        console.log(crop_area);

        let rst = new cv.Mat();
        rst = norm_dots.roi(crop_area);

        pruned_dots.delete();
        norm_dots.delete();

        return rst;
    };

    const dots_for_quantized_levels = async (dots, num_levels) => {
        let rst = [];

        // essentially, dilate the dot map more and more, and save the different dilation levels
        for (let i = 0; i < num_levels; i++) {
            const kernel = cv.getStructuringElement(
                cv.MORPH_ELLIPSE,
                new cv.Size(i + 1, i + 1));
            let dil = new cv.Mat();

            cv.dilate(dots, dil, kernel);
            rst.push(dil);

            kernel.delete();
        }

        return rst;
    };

    const merge = async (dots, layers) => {
        let result_initialized = false;
        let result = new cv.Mat();

        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            const norm_layer = im2norm(layer)

            // now separate the channels so that we can single-out the alpha
            const layer_split = new cv.MatVector();
            cv.split(norm_layer, layer_split);

            // get the alpha
            const alpha = layer_split.get(3);
            // curr_alpha.convertTo(curr_alpha, cv.CV_32F, 1.0/255.0);

            // construct the 4-channel alpha image
            const alpha_vec = new cv.MatVector();
            alpha_vec.push_back(alpha); alpha_vec.push_back(alpha); alpha_vec.push_back(alpha); alpha_vec.push_back(alpha);

            // merge the 4 together
            const alpha_mult = new cv.Mat();
            cv.merge(alpha_vec, alpha_mult);

            /* create gamma 1 */

            // must modulate hf by alpha_mult
            const gamma_2 = new cv.Mat();
            cv.multiply(dots, alpha_mult, gamma_2);

            // cv.imshow(canvas, gamma_1)

            /* create gamma 2 */
            const gamma_1 = new cv.Mat();
            cv.subtract(alpha_mult, gamma_2, gamma_1);

            /* mult & add */

            // foreground color (dots)
            const dots_color = new cv.Mat(norm_layer.rows, norm_layer.cols, cv.CV_32FC4, new cv.Scalar(0.5, 0.5, 0.5, 1.0));
            const colors_fg = new cv.Mat();
            cv.multiply(dots_color, gamma_2, colors_fg);

            // background color
            const colors_bg = new cv.Mat();
            cv.multiply(norm_layer, gamma_1, colors_bg);

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
            norm_layer.delete();
            layer_split.delete();
            // layer_weighted.delete();
            alpha.delete();
            alpha_vec.delete();
            alpha_mult.delete();
            gamma_1.delete();
            gamma_2.delete();
            dots_color.delete();
            colors_fg.delete();
            colors_bg.delete();
            sum.delete();
        }

        return result;
    };

    let isActiveSelectLayer = false;
    let hasInitialized = false;
    const selectLayer = async () => {
        const canvas = document.getElementById('canvas');
        const coordx = document.getElementById('coordx');
        const coordy = document.getElementById('coordy');
        const btn_selectLayer = document.getElementById('btn-select-layer');
        const dot_layer_canvas = document.getElementById('dot-layer-canvas');
        const scale = 0.6

        if (!canvas) return;

        isActiveSelectLayer = !isActiveSelectLayer;
        if (!isActiveSelectLayer) {
            btn_selectLayer.innerText = 'Select';

            if (hasInitialized) {
                const layers = await Promise.all([
                    loadImageAsMat('/layer_0.png'),
                    loadImageAsMat('/layer_1.png'),
                    loadImageAsMat('/layer_2.png'),
                    loadImageAsMat('/layer_3.png'),
                    loadImageAsMat('/layer_4.png'),
                    loadImageAsMat('/layer_5.png'),
                    loadImageAsMat('/layer_6.png'),
                ]);
                const _x = +coordx.value;
                const _y = +coordy.value;
                console.log(layers[2].ucharPtr(_y, _x));

                let max_alpha = 0;
                let max_index = 0;
                for (let i = 0; i < layers.length; ++i) {
                    const alpha = layers[i].ucharPtr(_y, _x)[3];
                    if (alpha > max_alpha) {
                        max_alpha = alpha;
                        max_index = i;
                    }
                }
                console.log(`idx=${max_index}, alpha=${max_alpha}`)

                try {
                    const layer = layers[max_index];
                    const quantized = await initialize(layer);
                    const masks = await buildMask(quantized, [0.2, 0.4, 0.6, 0.8, 1]);
                    const dots = await loadImageAsMat("/tex-4000.png");
                    const crop_dots = await dots_init(layer, dots);
                    const dot_strength = await dots_for_quantized_levels(crop_dots, 5);

                    // initialize this with zeros, otherwise the results will be all over the place (seriously)
                    let dots_combined = new cv.Mat.zeros(
                        masks[0].rows,
                        masks[0].cols,
                        masks[0].type()
                    );

                    /*
                        MATLAB-equivalent, which this whole thing is based on:
                        dots_combined = mask2 .* hf2 + mask3 .* hf3 + ... + maskn .* hfn;
                    */
                    for (let i = 0; i < dot_strength.length; i++) {
                        const mask = masks[i];
                        const tmp_dots = dot_strength[i];
                        const curr_dot_map = new cv.Mat();

                        cv.multiply(tmp_dots, mask, curr_dot_map);
                        cv.add(curr_dot_map, dots_combined, dots_combined);

                        curr_dot_map.delete();
                    }

                    // remember to normalize to the [0,1] range to prevent color distortions in the final result
                    let dots_c_norm = new cv.Mat();
                    cv.normalize(dots_combined, dots_c_norm, 0.0, 1.0, cv.NORM_MINMAX);

                    const result = await merge(dots_c_norm, layers);

                    // delete dots_cropped, replace it with this
                    cv.imshow(dot_layer_canvas, result);

                    quantized.delete();
                    masks.forEach(mask => mask.delete());
                    dots.delete();
                    crop_dots.delete();
                    dot_strength.forEach(dot => dot.delete());
                    dots_combined.delete();
                    dots_c_norm.delete();

                } catch (e) {
                    console.error(e);
                }

                layers.forEach(layer => layer.delete());
            }
            return;
        } else {
            btn_selectLayer.innerText = 'Decide';
        }

        if (!hasInitialized) {
            hasInitialized = true;
            canvas.addEventListener('click', function (e) {
                if (!isActiveSelectLayer) return;

                // Get the mouse position
                const rect = canvas.getBoundingClientRect();
                let x = e.clientX - rect.left;
                let y = e.clientY - rect.top;

                if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                    x = Math.floor(x / scale);
                    y = Math.floor(y / scale);

                    console.log(`Mouse position: (y=${y}, x=${x})`);

                    if (coordx) { coordx.value = `${x}`; }
                    if (coordy) { coordy.value = `${y}`; }
                };
            });
        }
    };

    return (
        <div id="layer-selector">
            <button
                onClick={selectLayer}
                className="default-button" id="btn-select-layer"
                style={{ padding: "10px 20px", marginTop: "20px", width: "30%" }}
            >
                Select
            </button>
            <span className="coord-text"
                style={{ padding: "10px", width: "5%" }}>x:</span>
            <input type="number" id="coordx" placeholder="X" min="0"
                style={{ width: "20%" }} />
            <span className="coord-text"
                style={{ padding: "10px", width: "5%" }}>y:</span>
            <input type="number" id="coordy" placeholder="Y" min="0"
                style={{ width: "20%" }} />
        </div>
    );
}

export default GetLayer;