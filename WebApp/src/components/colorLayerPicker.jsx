/**
 * @fileoverview This file contains functions to handle color layer selection
 * based on the coordinates where the mouse is pointed. It provides utilities
 * to interact with and manipulate color layers dynamically.
 * 
 * @author Xiangxiang Wang
 * @date 2025-04-17
 */

import React, { useState } from 'react';

function get_alpha_channel(img) {
    const img_vec = new cv.MatVector();
    cv.split(img, img_vec)

    // we just need the alpha channel
    const channel = img_vec.get(3).clone();
    img_vec.delete();

    return channel;
}

function get_alpha_mat(img) {
    const alpha_channel = get_alpha_channel(img);

    // construct the 4-channel alpha image
    const vec = new cv.MatVector();
    for (let i = 0; i < 4; ++i) vec.push_back(alpha_channel);

    // merge the 4 together
    const rst = new cv.Mat();
    cv.merge(vec, rst);

    alpha_channel.delete();
    vec.delete();

    return rst;
}

function get_rgb_mat(img) {
    // Remove alpha (keep only RGB)
    const channels = new cv.MatVector();
    cv.split(img, channels);

    // // manually keep only first 3
    const vec = new cv.MatVector();
    for (let i = 0; i < 3; ++i) vec.push_back(channels.get(i));

    // merge into final RGB result
    const rst = new cv.Mat();
    cv.merge(vec, rst);

    channels.delete();
    vec.delete();

    return rst;
}

function loadImageAsMat(source) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (source instanceof File) {
            img.src = URL.createObjectURL(source);
        } else {
            img.src = source;
        }
        // img.src = source;
        img.onload = () => {
            const mat = cv.imread(img);
            resolve(mat);

            if (source instanceof File) {
                URL.revokeObjectURL(img.src);
            }
        };
        img.onerror = (err) => {
            reject(err);
        };
    });
}

function im2norm(img, lb = 0, rb = 1) {
    const rst = new cv.Mat();

    img.convertTo(rst, cv.CV_32FC4);
    cv.normalize(rst, rst, lb, rb, cv.NORM_MINMAX);

    return rst;
}

function layer_init(layer) {
    const norm_layer = im2norm(layer);
    const alpha_channel = get_alpha_channel(norm_layer);

    // now quantize (based on Yagiz's method in 361, the first MATLAB lecture; ask Arya if you wanna see it)
    let rst = new cv.Mat();
    let scale_mat = new cv.Mat(
        alpha_channel.rows,
        alpha_channel.cols,
        alpha_channel.type(),
        [5, 5, 5, 0]
    );
    cv.multiply(alpha_channel, scale_mat, rst);
    rst.convertTo(rst, cv.CV_8U);
    rst.convertTo(rst, cv.CV_32F, 1 / 5);

    norm_layer.delete();
    alpha_channel.delete();
    scale_mat.delete();

    return rst;
}

function build_masks(src, levels) {
    return levels.map(level => {
        let scale_level = new cv.Mat(
            src.rows,
            src.cols,
            src.type(),
            [level, level, level, 0]
        );
        let mask_channel = new cv.Mat();
        cv.inRange(src, scale_level, scale_level, mask_channel);

        let vec = new cv.MatVector();
        for (let i = 0; i < 4; ++i) vec.push_back(mask_channel);

        let rst = new cv.Mat();
        cv.merge(vec, rst);
        rst.convertTo(rst, cv.CV_32FC4);

        scale_level.delete();
        mask_channel.delete();
        vec.delete();

        return rst;
    });
}

function dots_init(layer, dots, lb = 0, rb = 1) {
    console.log(lb, rb);
    const norm_dots = im2norm(dots, lb, rb);
    const pruned_dots = new cv.Mat();
    const layer_size = new cv.Size(layer.cols, layer.rows);

    cv.resize(norm_dots, pruned_dots, layer_size, 0, 0, cv.INTER_CUBIC);

    const y_max = norm_dots.cols - layer.cols;
    const x_max = norm_dots.rows - layer.rows;
    const area = new cv.Rect(
        Math.floor(Math.random() * y_max),
        Math.floor(Math.random() * x_max),
        layer.cols,
        layer.rows
    );

    console.log(area);

    let rst = new cv.Mat();
    rst = norm_dots.roi(area);

    pruned_dots.delete();
    norm_dots.delete();

    return rst;
}

function dots_adjust_dot_size(dots, dot_size) {
    /* dilation & erosion <=> modifying dot intensity*/
    //important: perform the operation on floating-point values in the [0-1] range otherwise results will be distorted
    const kernel = cv.getStructuringElement(
        cv.MORPH_ELLIPSE,
        new cv.Size(dot_size, dot_size)
    );

    let erd_dots = new cv.Mat();
    cv.erode(dots, erd_dots, kernel);

    let dil_dots = new cv.Mat();
    cv.dilate(dots, dil_dots, kernel);

    // check for dot size modification from the user
    const rst = dot_size >= 5 ? dil_dots.clone() : erd_dots.clone();

    kernel.delete();
    erd_dots.delete();
    dil_dots.delete();

    return rst;
}

function dots_for_quantized_levels(dots, num_levels) {
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
}

function apply_dots_on_masks(dot_strength, masks) {
    // initialize this with zeros, otherwise the results will be all over the place (seriously)
    let rst = new cv.Mat.zeros(
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
        const dots = dot_strength[i];
        const temp = new cv.Mat();

        cv.multiply(dots, mask, temp);
        cv.add(temp, rst, rst);

        temp.delete();
    }

    // remember to normalize to the [0,1] range to prevent color distortions in the final result
    cv.normalize(rst, rst, 0.0, 1.0, cv.NORM_MINMAX);

    return rst;
}

async function get_whole_layer_masked_dots(layer, dots_path, dot_size, lb = 0, rb = 1) {
    const dots = await loadImageAsMat(dots_path);
    const crop_dots = dots_init(layer, dots, lb, rb);
    dots.delete();

    const norm_dots = dots_adjust_dot_size(crop_dots, dot_size);
    crop_dots.delete();

    return norm_dots;
}

async function get_single_masked_dots(layer, dots_path, num_levels, lb = 0, rb = 1) {
    const levels = Array.from({
        length: num_levels + 1
    }, (_, i) => i / (num_levels)).slice(1);
    console.log(levels);
    const dots = await loadImageAsMat(dots_path);
    const crop_dots = dots_init(layer, dots, lb, rb);
    dots.delete();

    const dot_strengths = dots_for_quantized_levels(crop_dots, num_levels);
    crop_dots.delete();

    const quantized = layer_init(layer);
    const masks = build_masks(quantized, levels);
    quantized.delete();

    const norm_dots = apply_dots_on_masks(dot_strengths, masks);
    masks.forEach(mask => mask.delete());
    dot_strengths.forEach(dots => dots.delete());

    // quantized.delete();
    // masks.forEach(mask => mask.delete());
    // dots.delete();
    // crop_dots.delete();
    // dot_strengths.forEach(dots => dots.delete());

    return norm_dots;
}

/* Suppose the dots_paths is a list of dict with a fixed format:
 * dots_paths = {
 *   "dots_path": "<texture-path>",
 *   "layer_index": layer_index
 * } 
 */
async function get_masked_dots(
    layers,
    configs,
    dot_size,
    num_levels,
    whole = false,
    lb = 0,
    rb = 1) {
    let rst;

    if (!configs.length || whole) {
        const dots_path = configs.length ? configs[0]["dots_path"] : get_dots_path();

        rst = await get_whole_layer_masked_dots(
            layers[0],
            dots_path,
            dot_size,
            lb = lb,
            rb = rb
        );
    } else {
        rst = new cv.Mat.zeros(
            layers[0].rows,
            layers[0].cols,
            cv.CV_32FC4,
        );

        for (const config of configs) {
            const norm_dots = await get_single_masked_dots(
                layers[config["layer_index"]],
                config["dots_path"],
                num_levels,
                lb = lb,
                rb = rb
            );
            cv.add(rst, norm_dots, rst);
            norm_dots.delete();
        }

        cv.divide(
            rst,
            new cv.Mat(
                rst.rows,
                rst.cols,
                rst.type(),
                [configs.length, configs.length, configs.length, configs.length]
            ),
            rst);
    }

    cv.imshow("multi-dot-layer-canvas", rst);

    return rst;
}

function merge(dots, layers, dot_color) {
    let is_first = false;
    let result;

    layers.forEach(layer => {
        const norm_layer = im2norm(layer)
        const alpha_mat = get_alpha_mat(norm_layer);

        /* create gamma 1 */
        // must modulate hf by alpha_mult
        const gamma_2 = new cv.Mat();
        cv.multiply(dots, alpha_mat, gamma_2);

        /* create gamma 2 */
        const gamma_1 = new cv.Mat();
        cv.subtract(alpha_mat, gamma_2, gamma_1);

        /* mult & add */
        // foreground color (dots)
        const dots_color = new cv.Mat(
            norm_layer.rows,
            norm_layer.cols,
            cv.CV_32FC4,
            dot_color
        );
        const colors_fg = new cv.Mat();
        cv.multiply(dots_color, gamma_2, colors_fg);

        // background color
        const colors_bg = new cv.Mat();
        cv.multiply(norm_layer, gamma_1, colors_bg);

        // put foreground & background together
        const temp = new cv.Mat();
        cv.add(colors_bg, colors_fg, temp);

        // if this is the first iteration, need to initialize the 'result' output
        if (!is_first) {
            result = temp.clone();
            is_first = true;
        }
        else {
            cv.add(result, temp, result);
        }

        // free memory (good ol' C++ <3)
        norm_layer.delete();
        alpha_mat.delete();
        gamma_1.delete();
        gamma_2.delete();
        dots_color.delete();
        colors_fg.delete();
        colors_bg.delete();
        temp.delete();
    });

    return result;
}

async function apply_dots_on_layers(layers, configs, canvas_name, whole = false) {

    let dot_size = get_dot_size();
    let dot_color = get_dot_color();
    let num_levels = get_num_levels();
    let lb = 0;
    let rb = 1;
    const norm_dots = await get_masked_dots(
        layers,
        configs,
        dot_size,
        num_levels,
        whole = whole,
        lb = lb,
        rb = rb
    );
    const rgba_img = merge(norm_dots, layers, dot_color);

    /* important: one final OpenCV dance before we can display everything
     * right now the alpha layer has all sorts of garbage data, which, 
     * if not removed, will make the image look very weird
     */
    const rgb_img = get_rgb_mat(rgba_img);

    // Normalize once at the end
    cv.normalize(rgb_img, rgb_img, 0, 255, cv.NORM_MINMAX);
    rgb_img.convertTo(rgb_img, cv.CV_8UC3);

    cv.imshow(canvas_name, rgb_img);

    norm_dots.delete();
    rgb_img.delete();
    rgba_img.delete();
}

function get_dot_size() {
    const strength = document.getElementById("dot-strength-text").innerText;
    return +strength;
}

function get_dot_color() {
    const str = document.getElementById("dot-text").innerText;
    const match = str.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
    const hex_text = match ? match[0] : null;
    const hex = hex_text.replace(/^#/, '');

    // Parse r, g, b from hex
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    // Normalize to 0-1 range
    const rst = [r / 255, g / 255, b / 255, 1];

    return rst;
}

function get_dots_path() {
    const texture_path = document.getElementById("texture-preview").src;
    return new URL(texture_path).pathname;
}

function get_num_levels() {
    const num_levels = document.getElementById("dot-strength-select-text").value;
    return +num_levels;
}

function ApplyOnWholePage({ paths }) {
    const apply_dots = async () => {
        try {
            const layers = await Promise.all(
                paths.map(path => loadImageAsMat(path))
            );


            await apply_dots_on_layers(layers, [], "canvas", true);

            layers.forEach(layer => layer.delete());
        } catch (e) {
            console.error(e.name, e.message, e.stack);
        }
    };

    return (
        <div className="apply-whole-panel" style={{ marginTop: "20px" }}>
            <button
                onClick={apply_dots}
                className="default-button" id="btn-apply-whole-dots"
                style={{ padding: "10px 20px", marginTop: "5px", width: "100%" }}
            >
                Apply on Whole Page!
            </button>
        </div>
    );
}

function ApplyMultiDots({ paths }) {
    const [files, setFiles] = useState({}); // Tracks uploaded files

    const handleFileChange = (event, path) => {
        const file = event.target.files[0];
        setFiles(prev => ({ ...prev, [path]: file }));
        console.log(files);
    };

    const apply_dots = async () => {
        try {
            const layers = await Promise.all(
                paths.map(path => loadImageAsMat(path))
            );

            let configs = [];
            for (const [layer_path, file] of Object.entries(files)) {
                const index = paths.indexOf(layer_path);
                console.log(file);
                configs.push({
                    "dots_path": file,
                    "layer_index": index
                })
            }

            if (configs.length) {
                await apply_dots_on_layers(layers, configs, "canvas");
            }

            layers.forEach(layer => layer.delete());
        } catch (e) {
            console.error(e.name, e.message, e.stack);
        }
    };

    return (
        <div className="apply-panel" style={{ marginTop: "20px" }}>
            <div className="panel-header">
                {paths.map((path, index) => (
                    <div className="row" key={path}>
                        <div className="row-text">{path}</div>
                        <input type="file" className="upload-button"
                            onChange={(e) => handleFileChange(e, path)} />
                    </div>
                ))}
            </div>
            <div id="apply-multi-dots">
                <button
                    onClick={apply_dots}
                    className="default-button" id="btn-apply-dots"
                    style={{ padding: "10px 20px", marginTop: "5px", width: "100%" }}
                >
                    Apply Multiple Dot Patterns!
                </button>
            </div>
        </div>
    );
}

function GetLayer({ paths }) {
    let isActiveSelectLayer = false;
    let hasInitialized = false;
    const dot_color = [0.5, 0.5, 0.5, 1];

    const selectLayer = async () => {
        const canvas = document.getElementById('canvas');
        const coordx = document.getElementById('coordx');
        const coordy = document.getElementById('coordy');
        const btn_selectLayer = document.getElementById('btn-select-layer');
        const scale = 1;

        if (!canvas) return;

        isActiveSelectLayer = !isActiveSelectLayer;
        if (!isActiveSelectLayer) {
            btn_selectLayer.innerText = 'Select';

            if (hasInitialized) {
                const layers = await Promise.all(
                    paths.map(path => loadImageAsMat(path))
                );
                const _x = +coordx.value;
                const _y = +coordy.value;
                // console.log(layers[2].ucharPtr(_y, _x));

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
                // const texture_path = document.getElementById("texture-preview").src;
                // console.log(texture_path);

                try {
                    // const path = new URL(texture_path).pathname;
                    const path = get_dots_path();
                    console.log(path);
                    const configs = [
                        { "dots_path": path, "layer_index": max_index }
                    ];
                    await apply_dots_on_layers(layers, configs, "canvas");
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

export { GetLayer, ApplyMultiDots, ApplyOnWholePage };
